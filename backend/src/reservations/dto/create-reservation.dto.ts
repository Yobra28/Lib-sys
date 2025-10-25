/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDateString, IsOptional } from 'class-validator';

export class CreateReservationDto {
  @ApiProperty({ example: 'seat-uuid' })
  @IsString()
  @IsNotEmpty()
  seatId: string;

  @ApiProperty({ example: '2025-10-20' })
  @IsDateString()
  reservationDate: string;

  @ApiProperty({ example: '2025-10-20T08:00:00Z' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ example: '2025-10-20T17:00:00Z' })
  @IsDateString()
  endTime: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
