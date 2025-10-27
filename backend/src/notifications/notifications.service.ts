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
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async sendDueDateReminders() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    const dueBooks = await this.prisma.borrow.findMany({
      where: {
        status: 'ACTIVE',
        dueDate: {
          gte: tomorrow,
          lt: dayAfter,
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
        message: `Your borrowed book "${borrow.book.title}" is due tomorrow (${new Date(borrow.dueDate).toLocaleDateString()}). Please return it on time to avoid fines.`,
        type: 'DUE_REMINDER',
      });
    }

    console.log(`✅ Sent ${dueBooks.length} due date reminders`);
  }

  // Send overdue notifications daily
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
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
        message: `You have successfully borrowed "${borrow.book.title}". Due date: ${new Date(borrow.dueDate).toLocaleDateString()}`,
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
        message: `Your seat ${reservation.seat.seatNumber} has been reserved for ${new Date(reservation.reservationDate).toLocaleDateString()} from ${new Date(reservation.startTime).toLocaleTimeString()} to ${new Date(reservation.endTime).toLocaleTimeString()}`,
        type: 'RESERVATION_SUCCESS',
      });
    }
  }

  // Send seat reservation reminders 15 minutes before end time
  @Cron('*/15 * * * *') // Every 15 minutes
  async sendSeatReservationReminders() {
    const now = new Date();
    const reminderTime = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes from now

    const upcomingReservations = await this.prisma.seatReservation.findMany({
      where: {
        status: 'APPROVED',
        reservationDate: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
        },
        endTime: {
          gte: now,
          lte: reminderTime,
        },
      },
      include: {
        user: true,
        seat: true,
      },
    });

    for (const reservation of upcomingReservations) {
      // Check if we already sent a reminder for this reservation
      const existingReminder = await this.prisma.notification.findFirst({
        where: {
          userId: reservation.userId,
          type: 'SEAT_REMINDER',
          message: {
            contains: `Seat ${reservation.seat.seatNumber}`,
          },
          sentAt: {
            gte: new Date(now.getTime() - 30 * 60 * 1000), // Within last 30 minutes
          },
        },
      });

      if (!existingReminder) {
        await this.create({
          userId: reservation.userId,
          title: 'Seat Reservation Ending Soon',
          message: `Your seat reservation for ${reservation.seat.seatNumber} ends in 15 minutes (${new Date(reservation.endTime).toLocaleTimeString()}). Please prepare to vacate the seat.`,
          type: 'SEAT_REMINDER',
        });
      }
    }

    console.log(`✅ Sent ${upcomingReservations.length} seat reservation reminders`);
  }

  // Send due date reminders 5 hours before due date
  @Cron('0 */6 * * *') // Every 6 hours
  async sendDueDateReminders5Hours() {
    const now = new Date();
    const fiveHoursFromNow = new Date(now.getTime() + 5 * 60 * 60 * 1000);

    const dueBooks = await this.prisma.borrow.findMany({
      where: {
        status: 'ACTIVE',
        dueDate: {
          gte: now,
          lte: fiveHoursFromNow,
        },
      },
      include: {
        user: true,
        book: true,
      },
    });

    for (const borrow of dueBooks) {
      // Check if we already sent a 5-hour reminder for this borrow
      const existingReminder = await this.prisma.notification.findFirst({
        where: {
          userId: borrow.userId,
          type: 'DUE_REMINDER_5H',
          message: {
            contains: borrow.book.title,
          },
          sentAt: {
            gte: new Date(now.getTime() - 6 * 60 * 60 * 1000), // Within last 6 hours
          },
        },
      });

      if (!existingReminder) {
        await this.create({
          userId: borrow.userId,
          title: 'Book Due in 5 Hours',
          message: `Your borrowed book "${borrow.book.title}" is due in 5 hours (${new Date(borrow.dueDate).toLocaleString()}). Please return it on time to avoid fines.`,
          type: 'DUE_REMINDER_5H',
        });
      }
    }

    console.log(`✅ Sent ${dueBooks.length} 5-hour due date reminders`);
  }
}
