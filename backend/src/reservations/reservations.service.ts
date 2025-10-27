/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ReservationsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(userId: string, createReservationDto: CreateReservationDto) {
    const seat = await this.prisma.seat.findUnique({
      where: { id: createReservationDto.seatId },
    });

    if (!seat) {
      throw new NotFoundException('Seat not found');
    }

    if (seat.status !== 'AVAILABLE') {
      throw new BadRequestException('Seat is not available');
    }

    const startTime = new Date(createReservationDto.startTime);
    const endTime = new Date(createReservationDto.endTime);

    if (endTime <= startTime) {
      throw new BadRequestException('End time must be after start time');
    }

    // Check for conflicting reservations
    const conflictingReservation = await this.prisma.seatReservation.findFirst({
      where: {
        seatId: createReservationDto.seatId,
        status: { in: ['APPROVED'] }, // Only check approved reservations since we auto-approve
        reservationDate: new Date(createReservationDto.reservationDate),
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } },
            ],
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } },
            ],
          },
        ],
      },
    });

    if (conflictingReservation) {
      throw new BadRequestException(
        'Seat is already reserved for this time slot',
      );
    }

    // Create the reservation with auto-approval
    const reservation = await this.prisma.seatReservation.create({
      data: {
        userId,
        seatId: createReservationDto.seatId,
        reservationDate: new Date(createReservationDto.reservationDate),
        startTime,
        endTime,
        notes: createReservationDto.notes,
        status: 'APPROVED', // Auto-approve student reservations
        approvedBy: userId, // Student approves their own reservation
      },
      include: {
        seat: true,
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

    // Note: We don't update seat status to RESERVED here because:
    // 1. The seat should remain AVAILABLE for other time slots
    // 2. Time conflicts are handled by the reservation conflict detection logic
    // 3. Multiple reservations can exist for the same seat at different times

    // Send email notification for successful reservation
    await this.notificationsService.sendReservationConfirmation(reservation.id);

    return reservation;
  }

  async findAll(userId?: string, status?: string) {
    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (status) {
      where.status = status;
    }

    return this.prisma.seatReservation.findMany({
      where,
      include: {
        seat: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { reservationDate: 'desc' },
    });
  }

  async findOne(id: string) {
    const reservation = await this.prisma.seatReservation.findUnique({
      where: { id },
      include: {
        seat: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    return reservation;
  }

  async update(id: string, updateReservationDto: UpdateReservationDto) {
    await this.findOne(id);

    return this.prisma.seatReservation.update({
      where: { id },
      data: updateReservationDto,
      include: {
        seat: true,
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

  async approve(id: string, approvedBy: string) {
    const reservation = await this.findOne(id);

    if (reservation.status !== 'PENDING') {
      throw new BadRequestException(
        'Only pending reservations can be approved',
      );
    }

    return this.prisma.seatReservation.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy,
      },
      include: {
        seat: true,
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

  async cancel(id: string) {
    const reservation = await this.findOne(id);

    if (
      reservation.status === 'COMPLETED' ||
      reservation.status === 'CANCELLED'
    ) {
      throw new BadRequestException('Cannot cancel this reservation');
    }

    const updatedReservation = await this.prisma.seatReservation.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        seat: true,
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

    // Note: We don't need to update seat status here since seats remain AVAILABLE
    // and time conflicts are handled by the reservation conflict detection logic

    return updatedReservation;
  }

  async getMyReservations(userId: string, page: number = 1, limit: number = 5) {
    const skip = (page - 1) * limit;
    
    const [reservations, total] = await Promise.all([
      this.prisma.seatReservation.findMany({
        where: { userId },
        include: {
          seat: true,
        },
        orderBy: { reservationDate: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.seatReservation.count({
        where: { userId },
      }),
    ]);

    return {
      reservations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }
}
