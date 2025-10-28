/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { BorrowsService } from './borrows.service';
import { CreateBorrowDto } from './dto/create-borrow.dto';
import { ReturnBookDto } from './dto/return-book.dto';
import { SelfBorrowDto } from './dto/self-borrow.dto';
import { PayFineDto } from './dto/pay-fine.dto';
import { UpdateFineConfigurationDto } from './dto/update-fine-configuration.dto';
import { RenewBorrowDto } from './dto/renew-borrow.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('borrows')
@Controller('borrows')
@ApiBearerAuth()
export class BorrowsController {
  constructor(private readonly borrowsService: BorrowsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Issue book to student (Admin/Librarian only)' })
  @ApiResponse({ status: 201, description: 'Book borrowed successfully' })
  create(@Body() createBorrowDto: CreateBorrowDto) {
    return this.borrowsService.create(createBorrowDto);
  }

  @Post('self')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Borrow a book (Student only)' })
  @ApiResponse({ status: 201, description: 'Book borrowed successfully' })
  selfBorrow(@Body() selfBorrowDto: SelfBorrowDto, @CurrentUser('id') userId: string) {
    return this.borrowsService.create({ userId, ...selfBorrowDto });
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Get all borrow records (Admin/Librarian only)' })
  @ApiQuery({ name: 'userId', required: false })
  findAll(@Query('userId') userId?: string) {
    return this.borrowsService.findAll(userId);
  }

  @Get('my-borrows')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get my borrowed books (Student)' })
  getMyBorrows(@CurrentUser('id') userId: string) {
    return this.borrowsService.getMyBorrows(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get borrow record by ID' })
  findOne(@Param('id') id: string) {
    return this.borrowsService.findOne(id);
  }

  @Patch(':id/return')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Mark book as returned (Admin/Librarian only)' })
  returnBook(@Param('id') id: string, @Body() returnBookDto: ReturnBookDto) {
    return this.borrowsService.returnBook(id, returnBookDto);
  }

  @Patch(':id/return-self')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Return my borrowed book (Student only)' })
  returnMyBook(@Param('id') id: string, @Body() returnBookDto: ReturnBookDto, @CurrentUser('id') userId: string) {
    return this.borrowsService.returnBook(id, returnBookDto, userId);
  }

  @Patch(':id/renew')
  @ApiOperation({ summary: 'Renew borrowed book' })
  renewBook(@Param('id') id: string, @Body() renewDto: RenewBorrowDto) {
    return this.borrowsService.renewBook(id, renewDto.duration);
  }

  @Post('pay-fine')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Pay a fine (Student only)' })
  payFine(@Body() payFineDto: PayFineDto, @CurrentUser('id') userId: string) {
    return this.borrowsService.payFine(payFineDto, userId);
  }

  @Get('my-fines')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get my fines (Student only)' })
  getMyFines(@CurrentUser('id') userId: string) {
    return this.borrowsService.getMyFines(userId);
  }

  @Get(':id/calculate-fine')
  @ApiOperation({ summary: 'Calculate fine for a borrow record' })
  calculateFine(@Param('id') id: string) {
    return this.borrowsService.calculateFine(id);
  }

  @Post('fine-configuration')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update fine configuration (Admin only)' })
  updateFineConfiguration(
    @Body() updateDto: UpdateFineConfigurationDto,
    @CurrentUser('id') adminId: string
  ) {
    return this.borrowsService.updateFineConfiguration(updateDto, adminId);
  }

  @Get('fine-configuration/current')
  @ApiOperation({ summary: 'Get current fine configuration' })
  getCurrentFineConfiguration() {
    return this.borrowsService.getCurrentFineConfiguration();
  }
}