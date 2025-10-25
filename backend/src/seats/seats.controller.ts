/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { SeatsService } from './seats.service';
import { CreateSeatDto } from './dto/create-seat.dto';
import { UpdateSeatDto } from './dto/update-seat.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('seats')
@Controller('seats')
@ApiBearerAuth()
export class SeatsController {
  constructor(private readonly seatsService: SeatsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Add new seat (Admin/Librarian only)' })
  create(@Body() createSeatDto: CreateSeatDto) {
    return this.seatsService.create(createSeatDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all seats' })
  @ApiQuery({ name: 'floor', required: false, type: Number })
  @ApiQuery({ name: 'section', required: false, type: String })
  findAll(@Query('floor') floor?: string, @Query('section') section?: string) {
    return this.seatsService.findAll(
      floor ? parseInt(floor) : undefined,
      section,
    );
  }

  @Get('sections')
  @ApiOperation({ summary: 'Get all sections' })
  getSections() {
    return this.seatsService.getSections();
  }

  @Get('available')
  @ApiOperation({ summary: 'Get available seats for time slot' })
  @ApiQuery({ name: 'date', required: true })
  @ApiQuery({ name: 'startTime', required: true })
  @ApiQuery({ name: 'endTime', required: true })
  getAvailableSeats(
    @Query('date') date: string,
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
  ) {
    return this.seatsService.getAvailableSeats(
      new Date(date),
      new Date(startTime),
      new Date(endTime),
    );
  }

  @Get('search-by-time')
  @ApiOperation({ summary: 'Search available seats by time range with detailed information' })
  @ApiQuery({ name: 'date', required: true })
  @ApiQuery({ name: 'startTime', required: true })
  @ApiQuery({ name: 'endTime', required: true })
  @ApiQuery({ name: 'floor', required: false })
  @ApiQuery({ name: 'section', required: false })
  searchAvailableSeatsByTimeRange(
    @Query('date') date: string,
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
    @Query('floor') floor?: number,
    @Query('section') section?: string,
  ) {
    return this.seatsService.searchAvailableSeatsByTimeRange(
      new Date(date),
      new Date(startTime),
      new Date(endTime),
      floor,
      section,
    );
  }

  @Get(':id/availability')
  @ApiOperation({ summary: 'Get detailed availability information for a specific seat' })
  @ApiQuery({ name: 'date', required: true })
  getSeatAvailabilityDetails(
    @Param('id') id: string,
    @Query('date') date: string,
  ) {
    return this.seatsService.getSeatAvailabilityDetails(id, new Date(date));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get seat by ID' })
  findOne(@Param('id') id: string) {
    return this.seatsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Update seat (Admin/Librarian only)' })
  update(@Param('id') id: string, @Body() updateSeatDto: UpdateSeatDto) {
    return this.seatsService.update(id, updateSeatDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Delete seat (Admin/Librarian only)' })
  remove(@Param('id') id: string) {
    return this.seatsService.remove(id);
  }
}
