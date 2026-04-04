/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-return */
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
import { NotificationsService } from '../notifications/notifications.service';
import { BooksService } from '../books/books.service';
import { MpesaService } from '../payment/mpesa.service';
import { PaymentRequestService } from '../payment/payment-request.service';

@Injectable()
export class BorrowsService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private notificationsService: NotificationsService,
    private booksService: BooksService,
    private mpesaService: MpesaService,
    private paymentRequestService: PaymentRequestService,
  ) {}

  async create(createBorrowDto: CreateBorrowDto) {
    const book = await this.prisma.book.findUnique({
      where: { id: createBorrowDto.bookId },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    // Disallow borrowing unless book is AVAILABLE and has copies
    if (book.status !== 'AVAILABLE') {
      throw new BadRequestException(`Book cannot be borrowed. Current status: ${book.status}`);
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

    // Send email notification for successful borrow
    await this.notificationsService.sendBorrowConfirmation(borrow.id);

    // Compute recommendations for the student based on this borrow
    const recommendations = await this.booksService.recommendForBorrow({
      studentId: createBorrowDto.userId,
      borrowedBookId: createBorrowDto.bookId,
      limit: 12,
    });

    return { borrow, recommendations } as any;
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
            regno: true,
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

    if (userId && borrow.userId !== userId) {
      throw new BadRequestException('You can only return your own books');
    }

    if (borrow.status === 'RETURNED') {
      throw new BadRequestException('Book already returned');
    }

    const returnDate = new Date();
    const dueDate = new Date(borrow.dueDate);
    const isOverdue = returnDate > dueDate;
    const isStudentReturn = !!userId;

    // Pending fines for this borrow (normally created/updated by scheduler)
    let fineIds: string[] = [];
    let totalAmount = 0;

    let pendingFines = await this.prisma.fine.findMany({
      where: { borrowId: borrow.id, status: 'PENDING' },
    });

    // Fallback: if book is overdue but scheduler hasn't yet created a fine,
    // compute and create the fine now so the student can pay on return.
    // However, if the latest fine was WAIVED or PAID, we should *not*
    // recreate a pending fine – the admin has cleared it.
    if (pendingFines.length === 0 && isOverdue) {
      const latestFine = await this.prisma.fine.findFirst({
        where: { borrowId: borrow.id, userId: borrow.userId },
        orderBy: { createdAt: 'desc' },
      });

      if (!latestFine || latestFine.status === 'PENDING') {
        const daysOverdue = Math.ceil(
          (returnDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        const dailyRate = await this.getCurrentFineRate();
        const fineAmount = Math.round(daysOverdue * dailyRate * 100) / 100;

        const fine = latestFine && latestFine.status === 'PENDING'
          ? await this.prisma.fine.update({
              where: { id: latestFine.id },
              data: {
                amount: fineAmount,
                reason: `Overdue by ${daysOverdue} day(s) (KES ${dailyRate} per day rate)`,
              },
            })
          : await this.prisma.fine.create({
              data: {
                userId: borrow.userId,
                borrowId: borrow.id,
                amount: fineAmount,
                reason: `Overdue by ${daysOverdue} day(s) (KES ${dailyRate} per day rate)`,
              },
            });

        pendingFines = [fine];
      }
      // If latest fine is WAIVED or PAID, we intentionally leave pendingFines empty
      // so the return can proceed without payment.
    }

    if (pendingFines.length > 0) {
      totalAmount = pendingFines.reduce((s, f) => s + f.amount, 0);
      fineIds = pendingFines.map((f) => f.id);

      // Staff must ensure fines are paid before processing a return
      if (!isStudentReturn) {
        throw new BadRequestException(
          `Cannot return book. Pay pending fine of KES ${totalAmount.toFixed(2)} first.`,
        );
      }
    }

    // Student return with fine: require M-Pesa STK push
    if (isStudentReturn && fineIds.length > 0 && totalAmount > 0) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { phone: true },
      });
      const phone = returnBookDto.phone || user?.phone;
      if (!phone || phone.trim() === '') {
        throw new BadRequestException(
          'Phone number required for M-Pesa payment. Add it in your profile or provide it when returning.'
        );
      }
      const amountRounded = Math.round(totalAmount);
      if (amountRounded < 1) {
        throw new BadRequestException('Minimum M-Pesa amount is KES 1.');
      }
      const result = await this.mpesaService.initiateStkPush(
        phone.trim(),
        amountRounded,
        borrow.id,
        'Library fine',
      );
      if (!result.success || !result.checkoutRequestId) {
        throw new BadRequestException(
          result.errorMessage || 'Failed to initiate M-Pesa payment. Try again or pay at the library.'
        );
      }
      await this.paymentRequestService.create(
        result.checkoutRequestId,
        borrow.id,
        fineIds,
        userId!,
        amountRounded,
        phone.trim(),
      );
      return {
        requiresPayment: true,
        checkoutRequestId: result.checkoutRequestId,
        amount: amountRounded,
        currency: 'KES',
        message: 'Complete payment on your M-Pesa phone to complete the return.',
      };
    }

    // No fine to pay: complete return
    const updatedBorrow = await this.prisma.borrow.update({
      where: { id },
      data: { returnDate, status: 'RETURNED' },
      include: {
        book: true,
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        fines: true,
      },
    });

    await this.prisma.book.update({
      where: { id: borrow.bookId },
      data: { availableCopies: { increment: 1 }, status: 'AVAILABLE' },
    });

    await this.notificationsService.sendReturnConfirmation(borrow.id);
    return updatedBorrow;
  }

  async renewBook(id: string, duration: BorrowDuration) {
    const borrow = await this.findOne(id);

    if (borrow.status !== 'ACTIVE') {
      throw new BadRequestException('Only active borrows can be renewed');
    }

    // Disallow renewal when there are outstanding fines for this borrow
    const pendingFinesCount = await this.prisma.fine.count({
      where: { borrowId: borrow.id, status: 'PENDING' },
    });

    if (pendingFinesCount > 0) {
      throw new BadRequestException(
        'You have outstanding fines for this book. Please pay the fine before renewing.',
      );
    }

    const maxRenewals = this.configService.get('borrow.maxRenewals') || 3; // Default to 3 renewals
    
    if (borrow.renewalCount >= maxRenewals) {
      throw new BadRequestException(`Maximum renewals (${maxRenewals}) reached`);
    }

    // Check if renewal is allowed (only 1 day before due date)
    const now = new Date();
    const dueDate = new Date(borrow.dueDate);
    
    // Normalize to midnight for date-only comparison
    const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const dueDateDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()).getTime();
    const oneDayBeforeDueDate = dueDateDate - (24 * 60 * 60 * 1000);
    
    // Only allow renewal on or 1 day before the due date
    if (nowDate < oneDayBeforeDueDate) {
      const daysUntilRenewalAllowed = Math.ceil((oneDayBeforeDueDate - nowDate) / (1000 * 60 * 60 * 24));
      const renewalDate = new Date(oneDayBeforeDueDate);
      throw new BadRequestException(
        `You can only renew 1 day before the due date. Please renew on ${renewalDate.toLocaleDateString()} (in ${daysUntilRenewalAllowed} day(s))`
      );
    }

    // Calculate renewal duration in days from the chosen duration
    const renewalDays = this.getDurationInDays(duration);
    
    // New due date = current due date + renewal duration
    const newDueDate = new Date(dueDate.getTime() + renewalDays * 24 * 60 * 60 * 1000);

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

    // 1) Mark active borrows whose due date has passed as OVERDUE
    await this.prisma.borrow.updateMany({
      where: {
        status: 'ACTIVE',
        dueDate: { lt: now },
      },
      data: {
        status: 'OVERDUE',
      },
    });

    // 2) Create or update pending fines for all overdue borrows so that
    //    fines start counting from the day after the due date and
    //    grow every day.
    const overdueBorrows = await this.prisma.borrow.findMany({
      where: {
        status: 'OVERDUE',
        dueDate: { lt: now },
      },
      select: {
        id: true,
        userId: true,
        dueDate: true,
      },
    });

    if (overdueBorrows.length > 0) {
      const dailyRate = await this.getCurrentFineRate();
      const dayMs = 24 * 60 * 60 * 1000;

      for (const borrow of overdueBorrows) {
        const dueDate = new Date(borrow.dueDate);
        const daysOverdue = Math.max(
          1,
          Math.ceil((now.getTime() - dueDate.getTime()) / dayMs),
        );
        const fineAmount = Math.round(daysOverdue * dailyRate * 100) / 100;

        const latestFine = await this.prisma.fine.findFirst({
          where: {
            borrowId: borrow.id,
            userId: borrow.userId,
          },
          orderBy: { createdAt: 'desc' },
        });

        // If the latest fine is WAIVED or PAID, respect that decision and do not
        // recreate a pending fine for this borrow.
        if (latestFine && (latestFine.status === 'WAIVED' || latestFine.status === 'PAID')) {
          continue;
        }

        if (latestFine && latestFine.status === 'PENDING') {
          await this.prisma.fine.update({
            where: { id: latestFine.id },
            data: {
              amount: fineAmount,
              reason: `Overdue by ${daysOverdue} day(s) (KES ${dailyRate} per day rate)`,
            },
          });
        } else {
          await this.prisma.fine.create({
            data: {
              userId: borrow.userId,
              borrowId: borrow.id,
              amount: fineAmount,
              reason: `Overdue by ${daysOverdue} day(s) (KES ${dailyRate} per day rate)`,
            },
          });
        }
      }
    }

    console.log('✅ Overdue borrows and fines updated');
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
    return config?.dailyRate ?? 1.0; // Default when no active FineConfiguration row
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

  async getReturnStatus(borrowId: string, userId: string) {
    return this.paymentRequestService.getReturnStatus(borrowId, userId);
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
