import { Module } from '@nestjs/common';
import { BorrowsController } from './borrows.controller';
import { BorrowsService } from './borrows.service';
import { PrismaModule } from 'src/prisma/prisma.module'; // <-- Add this
import { ConfigModule } from '@nestjs/config'; // <-- Add this

@Module({
  imports: [
    PrismaModule,
    ConfigModule, // <-- provides ConfigService
  ],
  controllers: [BorrowsController],
  providers: [BorrowsService],
  exports: [BorrowsService],
})
export class BorrowsModule {}
