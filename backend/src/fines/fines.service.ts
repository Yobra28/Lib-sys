/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WaiveFineDto } from './dto/waive-fine.dto';

@Injectable()
export class FinesService {
  constructor(private prisma: PrismaService) {}

  // eslint-disable-next-line @typescript-eslint/require-await
  async findAll(userId?: string, status?: string) {
    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (status) {
      where.status = status;
    }

    return this.prisma.fine.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        borrow: {
          include: {
            book: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId?: string, userRole?: string) {
    const fine = await this.prisma.fine.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        borrow: {
          include: {
            book: true,
          },
        },
      },
    });

    if (!fine) {
      throw new NotFoundException('Fine not found');
    }

    // If user is a student, they can only access their own fines
    if (userRole === 'STUDENT' && userId && fine.userId !== userId) {
      throw new NotFoundException('Fine not found');
    }

    return fine;
  }

  async markAsPaid(id: string) {
    const fine = await this.findOne(id);

    if (fine.status !== 'PENDING') {
      throw new BadRequestException('Only pending fines can be marked as paid');
    }

    return this.prisma.fine.update({
      where: { id },
      data: {
        status: 'PAID',
        paidDate: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        borrow: {
          include: {
            book: true,
          },
        },
      },
    });
  }

  async waiveFine(id: string, waivedBy: string, waiveFineDto: WaiveFineDto) {
    const fine = await this.findOne(id);

    if (fine.status !== 'PENDING') {
      throw new BadRequestException('Only pending fines can be waived');
    }

    return this.prisma.fine.update({
      where: { id },
      data: {
        status: 'WAIVED',
        waivedBy,
        waivedDate: new Date(),
        notes: waiveFineDto.notes,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        borrow: {
          include: {
            book: true,
          },
        },
      },
    });
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async getMyFines(userId: string) {
    return this.prisma.fine.findMany({
      where: { userId },
      include: {
        borrow: {
          include: {
            book: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTotalFines(userId?: string) {
    const where: any = { status: 'PENDING' };

    if (userId) {
      where.userId = userId;
    }

    const result = await this.prisma.fine.aggregate({
      where,
      _sum: {
        amount: true,
      },
      _count: true,
    });

    return {
      totalAmount: result._sum.amount || 0,
      count: result._count,
    };
  }
}