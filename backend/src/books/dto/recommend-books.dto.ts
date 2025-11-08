/* eslint-disable prettier/prettier */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min, IsUUID } from 'class-validator';

export class RecommendBooksDto {
  @ApiPropertyOptional({ example: 'Computer Science', description: 'Book category to recommend from' })
  @IsString()
  category!: string;

  @ApiPropertyOptional({ example: 20, description: 'Maximum number of books to return' })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ example: 'a1b2c3d4-0000-1111-2222-333344445555', description: 'Student user ID to personalize/exclude owned borrows' })
  @IsOptional()
  @IsUUID()
  studentId?: string;
}