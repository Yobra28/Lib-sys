/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { BorrowDuration } from './create-borrow.dto';

export class RenewBorrowDto {
  @ApiProperty({ 
    example: '1_WEEK',
    enum: BorrowDuration,
    description: 'Renewal duration: 3_DAYS, 5_DAYS, 1_WEEK, 2_WEEKS'
  })
  @IsEnum(BorrowDuration)
  @IsNotEmpty()
  duration: BorrowDuration;
}

