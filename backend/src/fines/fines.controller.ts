/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Controller, Get, Param, Patch, Body, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { FinesService } from './fines.service';
import { WaiveFineDto } from './dto/waive-fine.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('fines')
@Controller('fines')
@ApiBearerAuth()
export class FinesController {
  constructor(private readonly finesService: FinesService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Get all fines (Admin/Librarian only)' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'status', required: false })
  findAll(@Query('userId') userId?: string, @Query('status') status?: string) {
    return this.finesService.findAll(userId, status);
  }

  @Get('my-fines')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get my fines (Student)' })
  getMyFines(@CurrentUser('id') userId: string) {
    return this.finesService.getMyFines(userId);
  }

  @Get('total')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Get total pending fines (Admin/Librarian only)' })
  @ApiQuery({ name: 'userId', required: false })
  getTotalFines(@Query('userId') userId?: string) {
    return this.finesService.getTotalFines(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get fine by ID' })
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string, @CurrentUser('role') userRole: UserRole) {
    return this.finesService.findOne(id, userId, userRole);
  }

  @Patch(':id/pay')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Mark fine as paid (Admin/Librarian only)' })
  markAsPaid(@Param('id') id: string) {
    return this.finesService.markAsPaid(id);
  }

  @Patch(':id/waive')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Waive fine (Admin/Librarian only)' })
  waiveFine(
    @Param('id') id: string,
    @CurrentUser('id') waivedBy: string,
    @Body() waiveFineDto: WaiveFineDto,
  ) {
    return this.finesService.waiveFine(id, waivedBy, waiveFineDto);
  }
}
