/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateNotificationDto {
  @ApiProperty({ example: 'user-uuid' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: 'Book Due Reminder' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Your book is due tomorrow' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ example: 'REMINDER' })
  @IsString()
  @IsOptional()
  type?: string;
}
