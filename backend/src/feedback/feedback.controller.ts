/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { RespondFeedbackDto } from './dto/respond-feedback.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('feedback')
@Controller('feedback')
@ApiBearerAuth()
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Submit feedback (Student)' })
  create(
    @CurrentUser('id') userId: string,
    @Body() createFeedbackDto: CreateFeedbackDto,
  ) {
    return this.feedbackService.create(userId, createFeedbackDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Get all feedback (Admin/Librarian only)' })
  @ApiQuery({ name: 'isRead', required: false, type: Boolean })
  findAll(@Query('isRead') isRead?: string) {
    return this.feedbackService.findAll(
      isRead !== undefined ? isRead === 'true' : undefined,
    );
  }

  @Get('my-feedback')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get my feedback (Student)' })
  getMyFeedback(@CurrentUser('id') userId: string) {
    return this.feedbackService.getMyFeedback(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get feedback by ID' })
  findOne(@Param('id') id: string) {
    return this.feedbackService.findOne(id);
  }

  @Patch(':id/respond')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Respond to feedback (Admin/Librarian only)' })
  respond(
    @Param('id') id: string,
    @Body() respondFeedbackDto: RespondFeedbackDto,
  ) {
    return this.feedbackService.respond(id, respondFeedbackDto);
  }

  @Patch(':id/read')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Mark feedback as read (Admin/Librarian only)' })
  markAsRead(@Param('id') id: string) {
    return this.feedbackService.markAsRead(id);
  }
}
