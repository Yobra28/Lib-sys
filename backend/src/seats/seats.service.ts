/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSeatDto } from './dto/create-seat.dto';
import { UpdateSeatDto } from './dto/update-seat.dto';

@Injectable()
export class SeatsService {
  constructor(private prisma: PrismaService) {}

  async create(createSeatDto: CreateSeatDto) {
    const existingSeat = await this.prisma.seat.findUnique({
      where: { seatNumber: createSeatDto.seatNumber },
    });

    if (existingSeat) {
      throw new ConflictException('Seat number already exists');
    }

    return this.prisma.seat.create({
      data: createSeatDto,
    });
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async findAll(floor?: number, section?: string) {
    const where: any = {};

    if (floor) {
      where.floor = floor;
    }

    if (section) {
      where.section = { contains: section, mode: 'insensitive' };
    }

    return this.prisma.seat.findMany({
      where,
      include: {
        reservations: {
          where: {
            status: { in: ['PENDING', 'APPROVED'] },
            endTime: { gte: new Date() },
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: [{ floor: 'asc' }, { seatNumber: 'asc' }],
    });
  }

  async findOne(id: string) {
    const seat = await this.prisma.seat.findUnique({
      where: { id },
      include: {
        reservations: {
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
          orderBy: { reservationDate: 'desc' },
        },
      },
    });

    if (!seat) {
      throw new NotFoundException('Seat not found');
    }

    return seat;
  }

  async update(id: string, updateSeatDto: UpdateSeatDto) {
    await this.findOne(id);

    if (updateSeatDto.seatNumber) {
      const existingSeat = await this.prisma.seat.findUnique({
        where: { seatNumber: updateSeatDto.seatNumber },
      });

      if (existingSeat && existingSeat.id !== id) {
        throw new ConflictException('Another seat with this number already exists');
      }
    }

    return this.prisma.seat.update({
      where: { id },
      data: updateSeatDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    const activeReservations = await this.prisma.seatReservation.count({
      where: {
        seatId: id,
        status: { in: ['PENDING', 'APPROVED'] },
      },
    });

    if (activeReservations > 0) {
      throw new BadRequestException('Cannot delete seat with active reservations');
    }

    return this.prisma.seat.delete({
      where: { id },
    });
  }

  async getAvailableSeats(date: Date, startTime: Date, endTime: Date) {
    const allSeats = await this.prisma.seat.findMany({
      where: {
        status: 'AVAILABLE',
      },
    });

    const seatsWithReservations = await this.prisma.seat.findMany({
      where: {
        status: 'AVAILABLE',
        reservations: {
          some: {
            status: { in: ['PENDING', 'APPROVED'] },
            reservationDate: date,
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
        },
      },
      select: { id: true },
    });

    const bookedSeatIds = new Set(seatsWithReservations.map(s => s.id));
    return allSeats.filter(seat => !bookedSeatIds.has(seat.id));
  }

  async getSections() {
    const sections = await this.prisma.seat.findMany({
      select: { section: true },
      distinct: ['section'],
    });

    return sections.map(s => s.section);
  }

  async searchAvailableSeatsByTimeRange(
    date: Date,
    startTime: Date,
    endTime: Date,
    floor?: number,
    section?: string
  ) {
    const where: any = {
      status: 'AVAILABLE',
    };

    if (floor) {
      where.floor = floor;
    }

    if (section) {
      where.section = { contains: section, mode: 'insensitive' };
    }

    // Get all seats that match the criteria
    const allSeats = await this.prisma.seat.findMany({
      where,
      include: {
        reservations: {
          where: {
            status: { in: ['PENDING', 'APPROVED'] },
            reservationDate: date,
          },
          select: {
            id: true,
            startTime: true,
            endTime: true,
            status: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: [{ floor: 'asc' }, { seatNumber: 'asc' }],
    });

    // Filter out seats that have conflicting reservations
    const availableSeats = allSeats.filter(seat => {
      return !seat.reservations.some(reservation => {
        const resStart = new Date(reservation.startTime);
        const resEnd = new Date(reservation.endTime);
        
        // Check for time overlap
        return (
          (resStart < endTime && resEnd > startTime)
        );
      });
    });

    return {
      availableSeats,
      totalSeats: allSeats.length,
      conflictingReservations: allSeats
        .filter(seat => !availableSeats.includes(seat))
        .map(seat => ({
          seatId: seat.id,
          seatNumber: seat.seatNumber,
          section: seat.section,
          floor: seat.floor,
          reservations: seat.reservations.filter(reservation => {
            const resStart = new Date(reservation.startTime);
            const resEnd = new Date(reservation.endTime);
            return resStart < endTime && resEnd > startTime;
          }),
        })),
    };
  }

  async getSeatAvailabilityDetails(seatId: string, date: Date) {
    const seat = await this.prisma.seat.findUnique({
      where: { id: seatId },
      include: {
        reservations: {
          where: {
            status: { in: ['PENDING', 'APPROVED'] },
            reservationDate: date,
          },
          select: {
            id: true,
            startTime: true,
            endTime: true,
            status: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { startTime: 'asc' },
        },
      },
    });

    if (!seat) {
      throw new NotFoundException('Seat not found');
    }

    return seat;
  }
}