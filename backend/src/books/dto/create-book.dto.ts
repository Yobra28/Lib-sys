/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, IsOptional, Min } from 'class-validator';

export class CreateBookDto {
  @ApiProperty({ example: 'The Great Gatsby' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'F. Scott Fitzgerald' })
  @IsString()
  @IsNotEmpty()
  author: string;

  @ApiProperty({ example: '978-0-7432-7356-5' })
  @IsString()
  @IsNotEmpty()
  isbn: string;

  @ApiProperty({ example: 'Fiction' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 'Scribner', required: false })
  @IsString()
  @IsOptional()
  publisher?: string;

  @ApiProperty({ example: 1925, required: false })
  @IsInt()
  @IsOptional()
  publishedYear?: number;

  @ApiProperty({ example: '1st Edition', required: false })
  @IsString()
  @IsOptional()
  edition?: string;

  @ApiProperty({ example: 5 })
  @IsInt()
  @Min(1)
  totalCopies: number;

  @ApiProperty({ example: 'A classic American novel...', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'https://example.com/cover.jpg', required: false })
  @IsString()
  @IsOptional()
  coverImage?: string;
}