/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { BorrowDuration } from './create-borrow.dto';

export class SelfBorrowDto {
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
