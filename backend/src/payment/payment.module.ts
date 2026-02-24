import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { MpesaService } from './mpesa.service';
import { PaymentRequestService } from './payment-request.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [PaymentController],
  providers: [MpesaService, PaymentRequestService],
  exports: [MpesaService, PaymentRequestService],
})
export class PaymentModule {}
