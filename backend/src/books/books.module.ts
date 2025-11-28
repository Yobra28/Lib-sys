/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { BooksService } from './books.service';
import { BooksController } from './books.controller';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { AiAgentService } from '../ai/ai-agent.service';

@Module({
  imports: [CloudinaryModule],
  controllers: [BooksController],
  providers: [BooksService, AiAgentService],
  exports: [BooksService],
})
export class BooksModule {}