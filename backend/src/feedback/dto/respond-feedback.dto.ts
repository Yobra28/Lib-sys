/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RespondFeedbackDto {
  @ApiProperty({
    example: 'Thank you for your feedback. We will consider your request.',
  })
  @IsString()
  @IsNotEmpty()
  response: string;
}
