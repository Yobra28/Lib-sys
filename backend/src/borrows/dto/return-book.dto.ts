/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

export class ReturnBookDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false, description: 'M-Pesa phone number (254XXXXXXXXX) for STK push when paying fines' })
  @IsOptional()
  @IsString()
  @Matches(/^(\+?254|0)[17]\d{8}$/, { message: 'Use a valid Kenyan phone number (e.g. 254712345678 or 0712345678)' })
  phone?: string;
}