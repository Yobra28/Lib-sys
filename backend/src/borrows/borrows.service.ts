/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { CreateBorrowDto, BorrowDuration } from './dto/create-borrow.dto';
import { ReturnBookDto } from './dto/return-book.dto';
import { PayFineDto } from './dto/pay-fine.dto';
import { UpdateFineConfigurationDto } from './dto/update-fine-configuration.dto';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class BorrowsService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async create(createBorrowDto: CreateBorrowDto) {
    const book = await this.prisma.book.findUnique({
      where: { id: createBorrowDto.bookId },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    if (book.availableCopies <= 0) {
      throw new BadRequestException('Book is not available for borrowing');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: createBorrowDto.userId },
    });

    if (!user || !user.isActive) {
      throw new NotFoundException('User not found or inactive');
    }

    // Check if user already has this book borrowed
    const existingBorrow = await this.prisma.borrow.findFirst({
      where: {
        userId: createBorrowDto.userId,
        bookId: createBorrowDto.bookId,
        status: { in: ['ACTIVE', 'OVERDUE'] },
      },
    });

    if (existingBorrow) {
      throw new BadRequestException('User already has this book borrowed');
    }

    // Calculate due date based on duration
    let dueDate: Date;
    if (createBorrowDto.dueDate) {
      dueDate = new Date(createBorrowDto.dueDate);
      if (isNaN(dueDate.getTime())) {
        throw new BadRequestException('Invalid due date provided');
      }
    } else {
      const durationDays = this.getDurationInDays(createBorrowDto.duration);
      dueDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
    }

    const borrow = await this.prisma.borrow.create({
      data: {
        userId: createBorrowDto.userId,
        bookId: createBorrowDto.bookId,
        dueDate,
      },
      include: {
        book: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Decrease available copies
    await this.prisma.book.update({
      where: { id: createBorrowDto.bookId },
      data: {
        availableCopies: { decrement: 1 },
        status: book.availableCopies - 1 === 0 ? 'BORROWED' : book.status,
      },
    });

    return borrow;
  }

  async findAll(userId?: string) {
    const where: any = {};
    
    if (userId) {
      where.userId = userId;
    }

    return this.prisma.borrow.findMany({
      where,
      include: {
        book: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        fines: true,
      },
      orderBy: { borrowDate: 'desc' },
    });
  }

  async findOne(id: string) {
    const borrow = await this.prisma.borrow.findUnique({
      where: { id },
      include: {
        book: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        fines: true,
      },
    });

    if (!borrow) {
      throw new NotFoundException('Borrow record not found');
    }

    return borrow;
  }

  async returnBook(id: string, returnBookDto: ReturnBookDto, userId?: string) {
    const borrow = await this.findOne(id);

    // If userId is provided, check that the user can only return their own books
    if (userId && borrow.userId !== userId) {
      throw new BadRequestException('You can only return your own books');
    }

    if (borrow.status === 'RETURNED') {
      throw new BadRequestException('Book already returned');
    }

    // Check if there are any pending fines that need to be paid
    const pendingFines = await this.prisma.fine.findMany({
      where: {
        borrowId: borrow.id,
        status: 'PENDING'
      }
    });

    if (pendingFines.length > 0) {
      const totalPendingAmount = pendingFines.reduce((sum, fine) => sum + fine.amount, 0);
      throw new BadRequestException(
        `Cannot return book. Please pay pending fine of ${totalPendingAmount} first.`
      );
    }

    const returnDate = new Date();
    const dueDate = new Date(borrow.dueDate);
    const isOverdue = returnDate > dueDate;

    // Calculate fine if overdue
    let fine: any = null;
    if (isOverdue) {
      const daysOverdue = Math.ceil((returnDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const dailyRate = await this.getCurrentFineRate();
      const fineAmount = daysOverdue * dailyRate;

      fine = await this.prisma.fine.create({
        data: {
          userId: borrow.userId,
          borrowId: borrow.id,
          amount: fineAmount,
          reason: `Overdue by ${daysOverdue} day(s)`,
        },
      });

      // If fine is created, prevent return until paid
      throw new BadRequestException(
        `Book is overdue by ${daysOverdue} day(s). Please pay fine of ${fineAmount} before returning.`
      );
    }

    // Update borrow record
    const updatedBorrow = await this.prisma.borrow.update({
      where: { id },
      data: {
        returnDate,
        status: 'RETURNED',
      },
      include: {
        book: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        fines: true,
      },
    });

    // Increase available copies
    await this.prisma.book.update({
      where: { id: borrow.bookId },
      data: {
        availableCopies: { increment: 1 },
        status: 'AVAILABLE',
      },
    });

    return {
      ...updatedBorrow,
      fine,
    };
  }

  async renewBook(id: string) {
    const borrow = await this.findOne(id);

    if (borrow.status !== 'ACTIVE') {
      throw new BadRequestException('Only active borrows can be renewed');
    }

    const maxRenewals = this.configService.get('borrow.maxRenewals') || 3; // Default to 3 renewals
    
    if (borrow.renewalCount >= maxRenewals) {
      throw new BadRequestException(`Maximum renewals (${maxRenewals}) reached`);
    }

    const defaultDuration = this.configService.get('borrow.defaultDurationDays') || 14; // Default to 14 days
    const newDueDate = new Date(borrow.dueDate.getTime() + defaultDuration * 24 * 60 * 60 * 1000);

    return this.prisma.borrow.update({
      where: { id },
      data: {
        dueDate: newDueDate,
        renewalCount: { increment: 1 },
      },
      include: {
        book: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  // Cron job to update overdue status
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async updateOverdueStatus() {
    const now = new Date();

    await this.prisma.borrow.updateMany({
      where: {
        status: 'ACTIVE',
        dueDate: { lt: now },
      },
      data: {
        status: 'OVERDUE',
      },
    });

    console.log('✅ Overdue borrows updated');
  }

  async getMyBorrows(userId: string) {
    return this.prisma.borrow.findMany({
      where: { userId },
      include: {
        book: true,
        fines: {
          where: { status: 'PENDING' },
        },
      },
      orderBy: { borrowDate: 'desc' },
    });
  }

  private getDurationInDays(duration: BorrowDuration): number {
    switch (duration) {
      case BorrowDuration.THREE_DAYS:
        return 3;
      case BorrowDuration.FIVE_DAYS:
        return 5;
      case BorrowDuration.ONE_WEEK:
        return 7;
      case BorrowDuration.TWO_WEEKS:
        return 14;
      default:
        return 14; // Default to 2 weeks
    }
  }

  private async getCurrentFineRate(): Promise<number> {
    const config = await this.prisma.fineConfiguration.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    return config?.dailyRate || 50.0; // Default rate
  }

  async payFine(payFineDto: PayFineDto, userId: string) {
    const fine = await this.prisma.fine.findUnique({
      where: { id: payFineDto.fineId },
      include: { borrow: true }
    });

    if (!fine) {
      throw new NotFoundException('Fine not found');
    }

    if (fine.userId !== userId) {
      throw new BadRequestException('You can only pay your own fines');
    }

    if (fine.status === 'PAID') {
      throw new BadRequestException('Fine already paid');
    }

    return this.prisma.fine.update({
      where: { id: payFineDto.fineId },
      data: {
        status: 'PAID',
        paidDate: new Date(),
        notes: payFineDto.notes || `Paid via ${payFineDto.paymentMethod || 'Unknown method'}`
      }
    });
  }

  async getMyFines(userId: string) {
    return this.prisma.fine.findMany({
      where: { userId },
      include: {
        borrow: {
          include: {
            book: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateFineConfiguration(updateDto: UpdateFineConfigurationDto, adminId: string) {
    // Deactivate current configuration
    await this.prisma.fineConfiguration.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    });

    // Create new configuration
    return this.prisma.fineConfiguration.create({
      data: {
        dailyRate: updateDto.dailyRate,
        isActive: updateDto.isActive ?? true,
        createdBy: adminId,
        updatedBy: adminId
      }
    });
  }

  async getCurrentFineConfiguration() {
    return this.prisma.fineConfiguration.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async calculateFine(borrowId: string): Promise<{ amount: number; daysOverdue: number }> {
    const borrow = await this.prisma.borrow.findUnique({
      where: { id: borrowId }
    });

    if (!borrow) {
      throw new NotFoundException('Borrow record not found');
    }

    const now = new Date();
    const dueDate = new Date(borrow.dueDate);
    
    if (now <= dueDate) {
      return { amount: 0, daysOverdue: 0 };
    }

    const daysOverdue = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    const dailyRate = await this.getCurrentFineRate();
    const amount = daysOverdue * dailyRate;

    return { amount, daysOverdue };
  }
}
