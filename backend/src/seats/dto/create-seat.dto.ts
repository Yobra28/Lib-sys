/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, IsOptional, Min } from 'class-validator';

export class CreateSeatDto {
  @ApiProperty({ example: 'A-101' })
  @IsString()
  @IsNotEmpty()
  seatNumber: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  floor: number;

  @ApiProperty({ example: 'Reading Hall' })
  @IsString()
  @IsNotEmpty()
  section: string;

  @ApiProperty({ example: 'Window seat with power outlet', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
