/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { RespondFeedbackDto } from './dto/respond-feedback.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class FeedbackService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(userId: string, createFeedbackDto: CreateFeedbackDto) {
    return this.prisma.feedback.create({
      data: {
        userId,
        ...createFeedbackDto,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async findAll(isRead?: boolean) {
    const where: any = {};

    if (isRead !== undefined) {
      where.isRead = isRead === true;
    }

    return this.prisma.feedback.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const feedback = await this.prisma.feedback.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!feedback) {
      throw new NotFoundException('Feedback not found');
    }

    return feedback;
  }

  async respond(id: string, respondFeedbackDto: RespondFeedbackDto) {
    const feedback = await this.findOne(id);

    // Update feedback with response
    const updatedFeedback = await this.prisma.feedback.update({
      where: { id },
      data: {
        response: respondFeedbackDto.response,
        isRead: true,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Create notification for the student
    await this.notificationsService.create({
      userId: feedback.userId,
      title: 'Feedback Response Received',
      message: `Your feedback regarding "${feedback.subject}" has been responded to. Check your feedback section for the response.`,
      type: 'FEEDBACK_RESPONSE',
    });

    return updatedFeedback;
  }

  async markAsRead(id: string) {
    await this.findOne(id);

    return this.prisma.feedback.update({
      where: { id },
      data: { isRead: true },
    });
  }

 
  async getMyFeedback(userId: string) {
    return this.prisma.feedback.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
