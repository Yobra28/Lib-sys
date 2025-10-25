/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('reports')
@Controller('reports')
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Get dashboard statistics (Admin/Librarian only)' })
  getDashboardStats() {
    return this.reportsService.getDashboardStats();
  }

  @Get('most-borrowed')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Get most borrowed books (Admin/Librarian only)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getMostBorrowedBooks(@Query('limit') limit?: string) {
    return this.reportsService.getMostBorrowedBooks(
      limit ? parseInt(limit) : 10,
    );
  }

  @Get('borrowing-trends')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Get borrowing trends (Admin/Librarian only)' })
  @ApiQuery({ name: 'months', required: false, type: Number })
  getBorrowingTrends(@Query('months') months?: string) {
    return this.reportsService.getBorrowingTrends(
      months ? parseInt(months) : 6,
    );
  }

  @Get('category-distribution')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Get book category distribution (Admin/Librarian only)' })
  getCategoryDistribution() {
    return this.reportsService.getCategoryDistribution();
  }

  @Get('seat-usage')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Get seat usage report (Admin/Librarian only)' })
  getSeatUsageReport() {
    return this.reportsService.getSeatUsageReport();
  }

  @Get('fine-collection')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Get fine collection report (Admin/Librarian only)' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getFineCollectionReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getFineCollectionReport(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('user-activity/:userId')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Get user activity report (Admin/Librarian only)' })
  getUserActivityReport(@Query('userId') userId: string) {
    return this.reportsService.getUserActivityReport(userId);
  }

  @Get('overdue')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Get overdue books report (Admin/Librarian only)' })
  getOverdueReport() {
    return this.reportsService.getOverdueReport();
  }
}