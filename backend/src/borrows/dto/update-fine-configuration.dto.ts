/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, IsOptional, Min } from 'class-validator';

export class UpdateFineConfigurationDto {
  @ApiProperty({ example: 50.0, description: 'Daily fine rate in currency units' })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  dailyRate: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  isActive?: boolean;
}
