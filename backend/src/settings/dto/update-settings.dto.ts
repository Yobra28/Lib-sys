import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export interface SystemSettings {
  libraryName?: string;
  fineRatePerDay?: number;
  borrowLimit?: number;
  reservationLimit?: number;
  maxBorrowingDays?: number;
  maxRenewals?: number;
  renewalDays?: number;
  notificationEmailEnabled?: boolean;
  autoApproveReservations?: boolean;
  maintenanceMode?: boolean;
  [key: string]: any;
}

export class UpdateSettingsDto {
  @ApiProperty({ example: 'Smart Library', required: false })
  @IsOptional()
  @IsString()
  libraryName?: string;

  @ApiProperty({ example: 50, required: false })
  @IsOptional()
  @IsNumber()
  fineRatePerDay?: number;

  @ApiProperty({ example: 3, required: false })
  @IsOptional()
  @IsNumber()
  borrowLimit?: number;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  reservationLimit?: number;

  @ApiProperty({ example: 14, required: false })
  @IsOptional()
  @IsNumber()
  maxBorrowingDays?: number;

  @ApiProperty({ example: 3, required: false })
  @IsOptional()
  @IsNumber()
  maxRenewals?: number;

  @ApiProperty({ example: 7, required: false })
  @IsOptional()
  @IsNumber()
  renewalDays?: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  notificationEmailEnabled?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  autoApproveReservations?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  maintenanceMode?: boolean;
}

