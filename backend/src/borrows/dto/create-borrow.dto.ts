/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsDateString, IsEnum } from 'class-validator';

export enum BorrowDuration {
  THREE_DAYS = '3_DAYS',
  FIVE_DAYS = '5_DAYS',
  ONE_WEEK = '1_WEEK',
  TWO_WEEKS = '2_WEEKS'
}

export class CreateBorrowDto {
  @ApiProperty({ example: 'user-uuid' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: 'book-uuid' })
  @IsString()
  @IsNotEmpty()
  bookId: string;

  @ApiProperty({ 
    example: '1_WEEK',
    enum: BorrowDuration,
    description: 'Borrow duration: 3_DAYS, 5_DAYS, 1_WEEK, 2_WEEKS'
  })
  @IsEnum(BorrowDuration)
  @IsNotEmpty()
  duration: BorrowDuration;

  @ApiProperty({ example: '2025-11-01', required: false })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}