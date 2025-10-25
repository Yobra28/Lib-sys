/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '@prisma/client';

export class FilterUserDto {
  @ApiPropertyOptional({ 
    example: 'john',
    description: 'Search by name or email'
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ 
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    enum: UserRole,
    description: 'Filter by user role'
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ 
    example: true,
    description: 'Filter by active status'
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ 
    example: 1,
    description: 'Page number for pagination'
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  page?: number;

  @ApiPropertyOptional({ 
    example: 10,
    description: 'Number of items per page'
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  limit?: number;
}
