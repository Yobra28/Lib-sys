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
      totalFines,
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
      this.prisma.fine.aggregate({
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
      totalFinesAmount: totalFines._sum.amount || 0,
      overdueBooks,
    };
  }

  async getFinesTimeseries(months: number = 6) {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - (months - 1));
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    const fines = await this.prisma.fine.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { amount: true, status: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const buckets: { [key: string]: { month: string; paid: number; pending: number; total: number } } = {};
    const cursor = new Date(start);
    while (cursor <= end) {
      const key = `${cursor.getFullYear()}-${(cursor.getMonth() + 1).toString().padStart(2, '0')}`;
      buckets[key] = { month: key, paid: 0, pending: 0, total: 0 };
      cursor.setMonth(cursor.getMonth() + 1);
    }

    for (const f of fines) {
      const d = new Date(f.createdAt);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      const bucket = buckets[key];
      if (!bucket) continue;
      if (f.status === 'PAID') bucket.paid += f.amount || 0;
      else bucket.pending += f.amount || 0;
      bucket.total += f.amount || 0;
    }

    return Object.values(buckets);
  }

  async getBorrowStatusTimeseries(months: number = 6) {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - (months - 1));
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    const borrows = await this.prisma.borrow.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { status: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const buckets: { [key: string]: { month: string; active: number; overdue: number; returned: number } } = {};
    const cursor = new Date(start);
    while (cursor <= end) {
      const key = `${cursor.getFullYear()}-${(cursor.getMonth() + 1).toString().padStart(2, '0')}`;
      buckets[key] = { month: key, active: 0, overdue: 0, returned: 0 };
      cursor.setMonth(cursor.getMonth() + 1);
    }

    for (const b of borrows) {
      const d = new Date(b.createdAt);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      const bucket = buckets[key];
      if (!bucket) continue;
      if (b.status === 'ACTIVE') bucket.active += 1;
      else if (b.status === 'OVERDUE') bucket.overdue += 1;
      else if (b.status === 'RETURNED') bucket.returned += 1;
    }

    return Object.values(buckets);
  }

  async getSeatHeatmap(days: number = 7) {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);

    const reservations = await this.prisma.seatReservation.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        status: { in: ['APPROVED', 'COMPLETED'] },
      },
      select: { createdAt: true },
    });

    // Build heatmap: rows=hours[0..23], cols=days (YYYY-MM-DD)
    const dayKeys: string[] = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      dayKeys.push(cursor.toISOString().slice(0, 10));
      cursor.setDate(cursor.getDate() + 1);
    }

    const matrix: { [hour: number]: { [day: string]: number } } = {};
    for (let h = 0; h < 24; h++) {
      matrix[h] = {};
      for (const day of dayKeys) matrix[h][day] = 0;
    }

    for (const r of reservations) {
      const d = new Date(r.createdAt);
      const day = d.toISOString().slice(0, 10);
      const hour = d.getHours();
      if (matrix[hour] && matrix[hour][day] !== undefined) {
        matrix[hour][day] += 1;
      }
    }

    return { days: dayKeys, hours: Array.from({ length: 24 }, (_, i) => i), data: matrix };
  }

  async getSystemLogs(limit: number = 50) {
    // Collect recent changes across key entities and normalize
    const [
      users,
      borrows,
      fines,
      reservations,
      books,
    ] = await Promise.all([
      this.prisma.user.findMany({
        select: { id: true, email: true, firstName: true, lastName: true, createdAt: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: limit,
      }),
      this.prisma.borrow.findMany({
        select: { id: true, status: true, createdAt: true, updatedAt: true, userId: true, bookId: true, dueDate: true },
        orderBy: { updatedAt: 'desc' },
        take: limit,
      }),
      this.prisma.fine.findMany({
        select: { id: true, status: true, amount: true, createdAt: true, updatedAt: true, userId: true },
        orderBy: { updatedAt: 'desc' },
        take: limit,
      }),
      this.prisma.seatReservation.findMany({
        select: { id: true, status: true, createdAt: true, updatedAt: true, userId: true, seatId: true, startTime: true },
        orderBy: { updatedAt: 'desc' },
        take: limit,
      }),
      this.prisma.book.findMany({
        select: { id: true, title: true, author: true, createdAt: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: limit,
      }),
    ]);

    const entries: Array<{ timestamp: Date; type: string; message: string; ref: string }> = [];

    for (const u of users) {
      entries.push({ timestamp: u.createdAt, type: 'USER_CREATED', message: `User created: ${u.firstName} ${u.lastName} (${u.email})`, ref: u.id });
      if (u.updatedAt && u.updatedAt.getTime() !== u.createdAt.getTime()) {
        entries.push({ timestamp: u.updatedAt, type: 'USER_UPDATED', message: `User updated: ${u.firstName} ${u.lastName} (${u.email})`, ref: u.id });
      }
    }
    for (const b of borrows) {
      entries.push({ timestamp: b.createdAt, type: 'BORROW_CREATED', message: `Borrow created: ${b.id} (status ${b.status})`, ref: b.id });
      if (b.updatedAt && b.updatedAt.getTime() !== b.createdAt.getTime()) {
        entries.push({ timestamp: b.updatedAt, type: 'BORROW_UPDATED', message: `Borrow updated to ${b.status}`, ref: b.id });
      }
    }
    for (const f of fines) {
      entries.push({ timestamp: f.createdAt, type: 'FINE_CREATED', message: `Fine created: ${f.amount} (${f.status})`, ref: f.id });
      if (f.updatedAt && f.updatedAt.getTime() !== f.createdAt.getTime()) {
        entries.push({ timestamp: f.updatedAt, type: 'FINE_UPDATED', message: `Fine updated: ${f.amount} (${f.status})`, ref: f.id });
      }
    }
    for (const r of reservations) {
      entries.push({ timestamp: r.createdAt, type: 'RESERVATION_CREATED', message: `Reservation created: ${r.id} (${r.status})`, ref: r.id });
      if (r.updatedAt && r.updatedAt.getTime() !== r.createdAt.getTime()) {
        entries.push({ timestamp: r.updatedAt, type: 'RESERVATION_UPDATED', message: `Reservation updated to ${r.status}`, ref: r.id });
      }
    }
    for (const book of books) {
      entries.push({ timestamp: book.createdAt, type: 'BOOK_CREATED', message: `Book added: ${book.title} by ${book.author}`, ref: book.id });
      if (book.updatedAt && book.updatedAt.getTime() !== book.createdAt.getTime()) {
        entries.push({ timestamp: book.updatedAt, type: 'BOOK_UPDATED', message: `Book updated: ${book.title}`, ref: book.id });
      }
    }

    entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return entries.slice(0, limit);
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