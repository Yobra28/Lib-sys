/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const [
      totalBooks,
      totalUsers,
      activeBorrows,
      totalSeats,
      pendingFines,
      overdueBooks,
    ] = await Promise.all([
      this.prisma.book.count(),
      this.prisma.user.count({ where: { role: 'STUDENT' } }),
      this.prisma.borrow.count({ where: { status: 'ACTIVE' } }),
      this.prisma.seat.count(),
      this.prisma.fine.aggregate({
        where: { status: 'PENDING' },
        _sum: { amount: true },
      }),
      this.prisma.borrow.count({ where: { status: 'OVERDUE' } }),
    ]);

    return {
      totalBooks,
      totalUsers,
      activeBorrows,
      totalSeats,
      pendingFinesAmount: pendingFines._sum.amount || 0,
      overdueBooks,
    };
  }

  async getMostBorrowedBooks(limit: number = 10) {
    const books = await this.prisma.borrow.groupBy({
      by: ['bookId'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: limit,
    });

    const bookDetails = await Promise.all(
      books.map(async (item) => {
        const book = await this.prisma.book.findUnique({
          where: { id: item.bookId },
        });
        return {
          ...book,
          borrowCount: item._count.id,
        };
      }),
    );

    return bookDetails;
  }

  async getBorrowingTrends(months: number = 6) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const borrows = await this.prisma.borrow.findMany({
      where: {
        borrowDate: {
          gte: startDate,
        },
      },
      select: {
        borrowDate: true,
      },
    });

    const monthlyData: Record<string, number> = {};

    borrows.forEach((borrow) => {
      const month = new Date(borrow.borrowDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
      });
      monthlyData[month] = (monthlyData[month] || 0) + 1;
    });

    return Object.entries(monthlyData).map(([month, count]) => ({
      month,
      count,
    }));
  }

  async getCategoryDistribution() {
    const books = await this.prisma.book.groupBy({
      by: ['category'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    return books.map((item) => ({
      category: item.category,
      count: item._count.id,
    }));
  }

  async getSeatUsageReport() {
    const [totalSeats, reservedSeats, availableSeats] = await Promise.all([
      this.prisma.seat.count(),
      this.prisma.seat.count({ where: { status: 'RESERVED' } }),
      this.prisma.seat.count({ where: { status: 'AVAILABLE' } }),
    ]);

    const reservationsBySection = await this.prisma.seatReservation.groupBy({
      by: ['seatId'],
      _count: {
        id: true,
      },
      where: {
        status: { in: ['APPROVED', 'COMPLETED'] },
      },
    });

    return {
      totalSeats,
      reservedSeats,
      availableSeats,
      totalReservations: reservationsBySection.reduce(
        (sum, item) => sum + item._count.id,
        0,
      ),
    };
  }

  async getFineCollectionReport(startDate?: Date, endDate?: Date) {
    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [pending, paid, waived] = await Promise.all([
      this.prisma.fine.aggregate({
        where: { ...where, status: 'PENDING' },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.fine.aggregate({
        where: { ...where, status: 'PAID' },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.fine.aggregate({
        where: { ...where, status: 'WAIVED' },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return {
      pending: {
        amount: pending._sum.amount || 0,
        count: pending._count,
      },
      paid: {
        amount: paid._sum.amount || 0,
        count: paid._count,
      },
      waived: {
        amount: waived._sum.amount || 0,
        count: waived._count,
      },
      total: {
        amount:
          (pending._sum.amount || 0) +
          (paid._sum.amount || 0) +
          (waived._sum.amount || 0),
        count: pending._count + paid._count + waived._count,
      },
    };
  }

  async getUserActivityReport(userId: string) {
    const [totalBorrows, activeBorrows, overdueBooks, totalFines] =
      await Promise.all([
        this.prisma.borrow.count({ where: { userId } }),
        this.prisma.borrow.count({
          where: { userId, status: 'ACTIVE' },
        }),
        this.prisma.borrow.count({
          where: { userId, status: 'OVERDUE' },
        }),
        this.prisma.fine.aggregate({
          where: { userId, status: 'PENDING' },
          _sum: { amount: true },
        }),
      ]);

    return {
      totalBorrows,
      activeBorrows,
      overdueBooks,
      pendingFines: totalFines._sum.amount || 0,
    };
  }

  async getOverdueReport() {
    const overdueBooks = await this.prisma.borrow.findMany({
      where: {
        status: 'OVERDUE',
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
        fines: {
          where: { status: 'PENDING' },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    return overdueBooks.map((borrow) => {
      const daysOverdue = Math.ceil(
        (new Date().getTime() - new Date(borrow.dueDate).getTime()) /
          (1000 * 60 * 60 * 24),
      );

      return {
        ...borrow,
        daysOverdue,
        totalFine: borrow.fines.reduce((sum, fine) => sum + fine.amount, 0),
      };
    });
  }
}