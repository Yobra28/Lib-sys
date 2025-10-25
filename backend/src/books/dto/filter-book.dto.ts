/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { BookStatus } from '@prisma/client';

export class FilterBookDto {
  @ApiPropertyOptional({ example: 'Gatsby' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'Fiction' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'F. Scott Fitzgerald' })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiPropertyOptional({ enum: BookStatus })
  @IsOptional()
  @IsEnum(BookStatus)
  status?: BookStatus;
}