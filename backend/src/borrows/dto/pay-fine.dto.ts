/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class PayFineDto {
  @ApiProperty({ example: 'fine-uuid' })
  @IsString()
  @IsNotEmpty()
  fineId: string;

  @ApiProperty({ example: 'Payment method used', required: false })
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiProperty({ example: 'Transaction reference', required: false })
  @IsString()
  @IsOptional()
  transactionReference?: string;

  @ApiProperty({ example: 'Additional notes', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
