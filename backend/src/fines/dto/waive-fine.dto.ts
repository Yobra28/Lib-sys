/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class WaiveFineDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}