/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationsService {
  private transporter: nodemailer.Transporter;
  private readonly EAT_TZ = 'Africa/Nairobi';
  private readonly DAY_MS = 24 * 60 * 60 * 1000;
  private readonly EAT_OFFSET_MS = 3 * 60 * 60 * 1000; // UTC+3, no DST

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    // Initialize email transporter
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('email.host'),
      port: this.configService.get('email.port'),
      secure: false,
      auth: {
        user: this.configService.get('email.user'),
        pass: this.configService.get('email.password'),
      },
    });
  }

  async create(createNotificationDto: CreateNotificationDto) {
    const data = {
      ...createNotificationDto,
      type: createNotificationDto.type ?? 'GENERAL',
    };

    const notification = await this.prisma.notification.create({
      data,
      include: {
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

    // Send email notification
    await this.sendEmail(
      notification.user.email,
      notification.title,
      notification.message,
    );

    return notification;
  }

  private getEatDayBounds(instantUtc: Date): { start: Date; end: Date } {
    const ms = instantUtc.getTime();
    const eatMs = ms + this.EAT_OFFSET_MS;
    const dayStartEatMs = Math.floor(eatMs / this.DAY_MS) * this.DAY_MS;
    const dayEndEatMs = dayStartEatMs + this.DAY_MS;
    return {
      start: new Date(dayStartEatMs - this.EAT_OFFSET_MS),
      end: new Date(dayEndEatMs - this.EAT_OFFSET_MS),
    };
  }

  private formatTimeEAT(d: Date): string {
    return d.toLocaleTimeString('en-KE', { timeZone: this.EAT_TZ, hour: '2-digit', minute: '2-digit' });
  }

  private formatDateEAT(d: Date): string {
    return d.toLocaleDateString('en-KE', { timeZone: this.EAT_TZ });
  }

  async findAll(userId?: string) {
    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    return this.prisma.notification.findMany({
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
      },
      orderBy: { sentAt: 'desc' },
    });
  }

  async markAsRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  // Send due date reminders daily
  @Cron(CronExpression.EVERY_DAY_AT_8AM, { timeZone: 'Africa/Nairobi' })
  async sendDueDateReminders() {
    const now = new Date();
    const { start: tomorrowStart, end: dayAfterStart } = this.getEatDayBounds(new Date(now.getTime() + this.DAY_MS));

    const dueBooks = await this.prisma.borrow.findMany({
      where: {
        status: 'ACTIVE',
        dueDate: {
          gte: tomorrowStart,
          lt: dayAfterStart,
        },
      },
      include: {
        user: true,
        book: true,
      },
    });

    for (const borrow of dueBooks) {
      await this.create({
        userId: borrow.userId,
        title: 'Book Due Tomorrow',
        message: `Your borrowed book \"${borrow.book.title}\" is due tomorrow (${this.formatDateEAT(new Date(borrow.dueDate))}). Please return it on time to avoid fines.`,
        type: 'DUE_REMINDER',
      });
    }

    console.log(`✅ Sent ${dueBooks.length} due date reminders`);
  }

  // Send overdue notifications daily
  @Cron(CronExpression.EVERY_DAY_AT_9AM, { timeZone: 'Africa/Nairobi' })
  async sendOverdueNotifications() {
    const overdueBooks = await this.prisma.borrow.findMany({
      where: {
        status: 'OVERDUE',
      },
      include: {
        user: true,
        book: true,
      },
    });

    for (const borrow of overdueBooks) {
      const daysOverdue = Math.ceil(
        (new Date().getTime() - new Date(borrow.dueDate).getTime()) /
          (1000 * 60 * 60 * 24),
      );

      await this.create({
        userId: borrow.userId,
        title: 'Overdue Book',
        message: `Your book "${borrow.book.title}" is overdue by ${daysOverdue} day(s). Please return it immediately. Fine is being accumulated.`,
        type: 'OVERDUE',
      });
    }

    console.log(`✅ Sent ${overdueBooks.length} overdue notifications`);
  }

  private async sendEmail(to: string, subject: string, text: string) {
    try {
      await this.transporter.sendMail({
        from: this.configService.get('email.from'),
        to,
        subject,
        text,
        html: `<p>${text}</p>`,
      });
      console.log(`📧 Email sent to ${to}`);
    } catch (error) {
      console.error('Failed to send email:', error.message);
    }
  }

  async sendBorrowConfirmation(borrowId: string) {
    const borrow = await this.prisma.borrow.findUnique({
      where: { id: borrowId },
      include: { user: true, book: true },
    });

    if (borrow) {
      await this.create({
        userId: borrow.userId,
        title: 'Book Borrowed Successfully',
        message: `You have successfully borrowed \"${borrow.book.title}\". Due date: ${this.formatDateEAT(new Date(borrow.dueDate))}`,
        type: 'BORROW_SUCCESS',
      });
    }
  }

  async sendReturnConfirmation(borrowId: string) {
    const borrow = await this.prisma.borrow.findUnique({
      where: { id: borrowId },
      include: { user: true, book: true },
    });

    if (borrow) {
      await this.create({
        userId: borrow.userId,
        title: 'Book Returned Successfully',
        message: `Thank you for returning "${borrow.book.title}".`,
        type: 'RETURN_SUCCESS',
      });
    }
  }

  async sendReservationConfirmation(reservationId: string) {
    const reservation = await this.prisma.seatReservation.findUnique({
      where: { id: reservationId },
      include: { user: true, seat: true },
    });

    if (reservation) {
      await this.create({
        userId: reservation.userId,
        title: 'Seat Reservation Confirmed',
        message: `Your seat ${reservation.seat.seatNumber} has been reserved for ${this.formatDateEAT(new Date(reservation.reservationDate))} from ${this.formatTimeEAT(new Date(reservation.startTime))} to ${this.formatTimeEAT(new Date(reservation.endTime))} (EAT)`,
        type: 'RESERVATION_SUCCESS',
      });
    }
  }

  // Send seat reservation reminders 30 minutes and 15 minutes before end time
  @Cron('*/15 * * * *', { timeZone: 'Africa/Nairobi' }) // Every 15 minutes (aligned to :00, :15, :30, :45)
  async sendSeatReservationReminders() {
    const now = new Date();
    const { start: todayStart, end: tomorrowStart } = this.getEatDayBounds(now);

    // Targets at exactly -30m and -15m from end time (rounded to minute)
    const target30 = new Date(now.getTime() + 30 * 60 * 1000);
    target30.setSeconds(0, 0);
    const target15 = new Date(now.getTime() + 15 * 60 * 1000);
    target15.setSeconds(0, 0);

    const [reservations30, reservations15] = await Promise.all([
      this.prisma.seatReservation.findMany({
        where: {
          status: 'APPROVED',
          reservationDate: { gte: todayStart, lt: tomorrowStart },
          endTime: {
            gte: new Date(target30.getTime() - 60 * 1000),
            lt: new Date(target30.getTime() + 60 * 1000),
          },
        },
        include: { user: true, seat: true },
      }),
      this.prisma.seatReservation.findMany({
        where: {
          status: 'APPROVED',
          reservationDate: { gte: todayStart, lt: tomorrowStart },
          endTime: {
            gte: new Date(target15.getTime() - 60 * 1000),
            lt: new Date(target15.getTime() + 60 * 1000),
          },
        },
        include: { user: true, seat: true },
      }),
    ]);

    let sent30 = 0;
    for (const reservation of reservations30) {
      const existing = await this.prisma.notification.findFirst({
        where: {
          userId: reservation.userId,
          type: 'SEAT_REMINDER_30M',
          message: { contains: `Seat ${reservation.seat.seatNumber}` },
          sentAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
        },
      });
      if (!existing) {
        await this.create({
          userId: reservation.userId,
          title: 'Seat Reservation Ending Soon',
          message: `Your seat reservation for ${reservation.seat.seatNumber} ends in 30 minutes (${this.formatTimeEAT(new Date(reservation.endTime))} EAT). Please prepare accordingly.`,
          type: 'SEAT_REMINDER_30M',
        });
        sent30++;
      }
    }

    let sent15 = 0;
    for (const reservation of reservations15) {
      const existing = await this.prisma.notification.findFirst({
        where: {
          userId: reservation.userId,
          type: 'SEAT_REMINDER_15M',
          message: { contains: `Seat ${reservation.seat.seatNumber}` },
          sentAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
        },
      });
      if (!existing) {
        await this.create({
          userId: reservation.userId,
          title: 'Seat Reservation Ending Soon',
          message: `Your seat reservation for ${reservation.seat.seatNumber} ends in 15 minutes (${this.formatTimeEAT(new Date(reservation.endTime))} EAT). Please prepare to vacate the seat.`,
          type: 'SEAT_REMINDER_15M',
        });
        sent15++;
      }
    }

    console.log(`✅ Seat reminders — considered30=${reservations30.length}, sent30=${sent30}; considered15=${reservations15.length}, sent15=${sent15}`);
  }

  // Morning-of due date reminders (8 AM of the due date)
  @Cron(CronExpression.EVERY_DAY_AT_8AM, { timeZone: 'Africa/Nairobi' })
  async sendDueDateMorningOf() {
    const now = new Date();
    const { start: todayStart, end: tomorrowStart } = this.getEatDayBounds(now);

    const dueToday = await this.prisma.borrow.findMany({
      where: {
        status: 'ACTIVE',
        dueDate: { gte: todayStart, lt: tomorrowStart },
      },
      include: { user: true, book: true },
    });

    for (const borrow of dueToday) {
      await this.create({
        userId: borrow.userId,
        title: 'Book Due Today',
        message: `Your borrowed book \"${borrow.book.title}\" is due today (${this.formatDateEAT(new Date(borrow.dueDate))}). Please return it by the due time to avoid fines.`,
        type: 'DUE_REMINDER_TODAY',
      });
    }

    console.log(`✅ Sent ${dueToday.length} due-today reminders`);
  }
}
