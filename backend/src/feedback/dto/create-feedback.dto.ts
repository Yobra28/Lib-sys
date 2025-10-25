/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateFeedbackDto {
  @ApiProperty({ example: 'Book Request' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ example: 'Please add more programming books' })
  @IsString()
  @IsNotEmpty()
  message: string;
}