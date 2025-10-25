/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ReturnBookDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}