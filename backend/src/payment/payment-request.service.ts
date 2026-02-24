/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PaymentRequestService {
  private readonly logger = new Logger(PaymentRequestService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(
    checkoutRequestId: string,
    borrowId: string,
    fineIds: string[],
    userId: string,
    amount: number,
    phoneNumber: string,
  ) {
    return this.prisma.paymentRequest.create({
      data: {
        checkoutRequestId,
        borrowId,
        fineIds: JSON.stringify(fineIds),
        userId,
        amount,
        phoneNumber,
        status: 'PENDING',
      },
    });
  }

  async findByCheckoutRequestId(checkoutRequestId: string) {
    return this.prisma.paymentRequest.findUnique({
      where: { checkoutRequestId },
    });
  }

  async completePayment(checkoutRequestId: string, mpesaReceiptNumber: string | null) {
    const pr = await this.findByCheckoutRequestId(checkoutRequestId);
    if (!pr || pr.status !== 'PENDING') return;

    const fineIds = JSON.parse(pr.fineIds) as string[];
    const returnDate = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.fine.updateMany({
        where: { id: { in: fineIds } },
        data: {
          status: 'PAID',
          paidDate: returnDate,
          notes: mpesaReceiptNumber
            ? `Paid via M-Pesa. Receipt: ${mpesaReceiptNumber}`
            : 'Paid via M-Pesa',
        },
      });

      await tx.borrow.update({
        where: { id: pr.borrowId },
        data: {
          returnDate,
          status: 'RETURNED',
        },
      });

      const borrow = await tx.borrow.findUnique({
        where: { id: pr.borrowId },
        include: { book: true },
      });
      if (borrow?.bookId) {
        await tx.book.update({
          where: { id: borrow.bookId },
          data: {
            availableCopies: { increment: 1 },
            status: 'AVAILABLE',
          },
        });
      }

      await tx.paymentRequest.update({
        where: { checkoutRequestId },
        data: {
          status: 'COMPLETED',
          mpesaReceiptNumber,
          completedAt: returnDate,
        },
      });
    });

    try {
      await this.notificationsService.sendReturnConfirmation(pr.borrowId);
    } catch (e) {
      this.logger.warn('Failed to send return notification', e);
    }
    this.logger.log(`Payment completed for checkout ${checkoutRequestId}, borrow ${pr.borrowId} returned.`);
  }

  async failPayment(checkoutRequestId: string) {
    await this.prisma.paymentRequest.updateMany({
      where: { checkoutRequestId },
      data: { status: 'FAILED' },
    });
    this.logger.log(`Payment failed for checkout ${checkoutRequestId}`);
  }

  async getReturnStatus(borrowId: string, userId: string): Promise<{
    returnStatus: 'pending' | 'returned';
    paymentStatus: 'none' | 'pending' | 'completed' | 'failed';
    amount?: number;
    currency: string;
    checkoutRequestId?: string;
  }> {
    const borrow = await this.prisma.borrow.findUnique({
      where: { id: borrowId },
      include: { fines: true },
    });
    if (!borrow || borrow.userId !== userId) {
      return {
        returnStatus: 'pending',
        paymentStatus: 'none',
        currency: 'KES',
      };
    }
    if (borrow.status === 'RETURNED') {
      return { returnStatus: 'returned', paymentStatus: 'none', currency: 'KES' };
    }

    const pendingPayment = await this.prisma.paymentRequest.findFirst({
      where: { borrowId, userId, status: { in: ['PENDING', 'COMPLETED', 'FAILED'] } },
      orderBy: { createdAt: 'desc' },
    });

    if (pendingPayment) {
      // Auto-fail very old pending payments so the UI does not spin forever
      let effectiveStatus = pendingPayment.status;
      if (effectiveStatus === 'PENDING') {
        const now = Date.now();
        const createdAt = pendingPayment.createdAt?.getTime?.()
          ? pendingPayment.createdAt.getTime()
          : new Date(pendingPayment.createdAt as unknown as string).getTime();
        const maxPendingMs = 2 * 60 * 1000; // 2 minutes
        if (!Number.isNaN(createdAt) && now - createdAt > maxPendingMs) {
          await this.prisma.paymentRequest.update({
            where: { id: pendingPayment.id },
            data: { status: 'FAILED' },
          });
          effectiveStatus = 'FAILED';
          this.logger.warn(
            `Payment request ${pendingPayment.checkoutRequestId} auto-marked FAILED after timeout.`,
          );
        }
      }

      const paymentStatus =
        effectiveStatus === 'COMPLETED'
          ? 'completed'
          : effectiveStatus === 'FAILED'
            ? 'failed'
            : 'pending';
      const returnStatus = effectiveStatus === 'COMPLETED' ? 'returned' : 'pending';
      return {
        returnStatus,
        paymentStatus,
        amount: pendingPayment.amount,
        currency: 'KES',
        checkoutRequestId: pendingPayment.checkoutRequestId,
      };
    }

    const pendingFines = borrow.fines.filter((f) => f.status === 'PENDING');
    const totalPending = pendingFines.reduce((s, f) => s + f.amount, 0);
    if (pendingFines.length > 0) {
      return {
        returnStatus: 'pending',
        paymentStatus: 'none',
        amount: totalPending,
        currency: 'KES',
      };
    }
    return { returnStatus: 'pending', paymentStatus: 'none', currency: 'KES' };
  }
}
