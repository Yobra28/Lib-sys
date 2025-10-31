/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { FilterUserDto } from './dto/filter-user.dto';
import { UserStatsDto } from './dto/user-stats.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new user (Admin/Librarian only)
   */
  async create(createUserDto: CreateUserDto) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(createUserDto.password);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        password: hashedPassword,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        role: createUserDto.role,
        phone: createUserDto.phone,
        regno: (createUserDto as any).regno,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        regno: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      user,
      message: 'User created successfully',
    };
  }

  /**
   * Get all users with optional filters and pagination
   */
  async findAll(filterDto?: FilterUserDto) {
    const { search, role, isActive, page: pageRaw = 1, limit: limitRaw = 10 } = filterDto || {};

    // Ensure page and limit are numbers
    const page = typeof pageRaw === 'string' ? parseInt(pageRaw, 10) : pageRaw;
    const limit = typeof limitRaw === 'string' ? parseInt(limitRaw, 10) : limitRaw;

    const where: any = {};

    // Search filter (email, firstName, lastName)
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Role filter
    if (role) {
      where.role = role;
    }

    // Active status filter
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count
    const total = await this.prisma.user.count({ where });

    // Get users
    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        regno: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return {
      users,
      total,
    };
  }

  /**
   * Get user by ID
   */
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        regno: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            borrows: true,
            reservations: true,
            fines: true,
            feedback: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Get user by email
   */
  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        regno: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Update user details
   */
  async update(id: string, updateUserDto: UpdateUserDto) {
    // Check if user exists
    await this.findOne(id);

    // Update user
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        regno: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return {
      user: updatedUser,
      message: 'User updated successfully',
    };
  }

  /**
   * Update user password (Admin only)
   */
  async updatePassword(id: string, updatePasswordDto: UpdatePasswordDto) {
    // Check if user exists
    await this.findOne(id);

    // Hash new password
    const hashedPassword = await this.hashPassword(updatePasswordDto.password);

    // Update password
    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return {
      message: 'Password updated successfully',
    };
  }

  /**
   * Activate user account
   */
  async activate(id: string) {
    // Check if user exists
    const user = await this.findOne(id);

    if (user.isActive) {
      throw new BadRequestException('User is already active');
    }

    await this.prisma.user.update({
      where: { id },
      data: { isActive: true },
    });

    return {
      message: 'User activated successfully',
    };
  }

  /**
   * Deactivate user account
   */
  async deactivate(id: string) {
    // Check if user exists
    const user = await this.findOne(id);

    if (!user.isActive) {
      throw new BadRequestException('User is already inactive');
    }

    // Check if user has active borrows
    const activeBorrows = await this.prisma.borrow.count({
      where: {
        userId: id,
        status: { in: ['ACTIVE', 'OVERDUE'] },
      },
    });

    if (activeBorrows > 0) {
      throw new BadRequestException(
        'Cannot deactivate user with active borrows',
      );
    }

    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return {
      message: 'User deactivated successfully',
    };
  }

  /**
   * Delete user (soft delete by deactivating)
   */
  async remove(id: string, currentUserId: string) {
    // Prevent self-deletion
    if (id === currentUserId) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    // Check if user exists
    const user = await this.findOne(id);

    // Check if user has any related records
    const [borrows, reservations, fines, feedback] = await Promise.all([
      this.prisma.borrow.count({ where: { userId: id } }),
      this.prisma.seatReservation.count({ where: { userId: id } }),
      this.prisma.fine.count({ where: { userId: id } }),
      this.prisma.feedback.count({ where: { userId: id } }),
    ]);

    const hasRecords =
      borrows > 0 || reservations > 0 || fines > 0 || feedback > 0;

    if (hasRecords) {
      // Soft delete (deactivate) if user has records
      await this.prisma.user.update({
        where: { id },
        data: { isActive: false },
      });

      return {
        message: 'User deactivated successfully (has existing records)',
      };
    } else {
      // Hard delete if no records
      await this.prisma.user.delete({
        where: { id },
      });

      return {
        message: 'User deleted successfully',
      };
    }
  }

  /**
   * Get user statistics
   */
  async getStats(): Promise<UserStatsDto> {
    const [totalUsers, activeUsers, usersByRole] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.groupBy({
        by: ['role'],
        _count: { id: true },
      }),
    ]);

    const roleStats = usersByRole.reduce(
      (acc, curr) => {
        acc[curr.role.toLowerCase()] = curr._count.id;
        return acc;
      },
      { admin: 0, librarian: 0, student: 0 },
    );

    return {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      usersByRole: roleStats,
    };
  }

  /**
   * Get user activity summary
   */
  async getUserActivity(id: string) {
    const user = await this.findOne(id);

    const [
      totalBorrows,
      activeBorrows,
      overdueBorrows,
      totalReservations,
      activeReservations,
      totalFines,
      pendingFines,
      feedbackCount,
    ] = await Promise.all([
      this.prisma.borrow.count({ where: { userId: id } }),
      this.prisma.borrow.count({
        where: { userId: id, status: 'ACTIVE' },
      }),
      this.prisma.borrow.count({
        where: { userId: id, status: 'OVERDUE' },
      }),
      this.prisma.seatReservation.count({ where: { userId: id } }),
      this.prisma.seatReservation.count({
        where: {
          userId: id,
          status: { in: ['PENDING', 'APPROVED'] },
        },
      }),
      this.prisma.fine.aggregate({
        where: { userId: id },
        _sum: { amount: true },
      }),
      this.prisma.fine.aggregate({
        where: { userId: id, status: 'PENDING' },
        _sum: { amount: true },
      }),
      this.prisma.feedback.count({ where: { userId: id } }),
    ]);

    return {
      user: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
      },
      activity: {
        borrows: {
          total: totalBorrows,
          active: activeBorrows,
          overdue: overdueBorrows,
        },
        reservations: {
          total: totalReservations,
          active: activeReservations,
        },
        fines: {
          total: totalFines._sum.amount || 0,
          pending: pendingFines._sum.amount || 0,
        },
        feedback: feedbackCount,
      },
    };
  }

  /**
   * Hash password
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }
}
