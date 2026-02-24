/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Controller, Post, Body, Get, Param, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { MpesaService, MpesaCallbackPayload } from './mpesa.service';
import { PaymentRequestService } from './payment-request.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('payments')
@Controller('payments')
export class PaymentController {
  constructor(
    private mpesaService: MpesaService,
    private paymentRequestService: PaymentRequestService,
  ) {}

  @Public()
  @Post('mpesa/callback')
  @ApiOperation({ summary: 'M-Pesa STK callback (called by Safaricom)' })
  async mpesaCallback(@Body() body: unknown, @Res() res: Response) {
    const payload = this.mpesaService.parseCallbackPayload(body);
    const result = this.mpesaService.getCheckoutResult(payload);

    const response = {
      ResultCode: 0,
      ResultDesc: 'Success',
    };

    if (!result.checkoutRequestId) {
      return res.status(200).json(response);
    }

    try {
      if (result.resultCode === 0) {
        await this.paymentRequestService.completePayment(
          result.checkoutRequestId,
          result.receiptNumber,
        );
      } else {
        await this.paymentRequestService.failPayment(result.checkoutRequestId);
      }
    } catch (e) {
      // Still return 200 so Safaricom does not retry
    }

    return res.status(200).json(response);
  }
}
