import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto, SystemSettings } from './dto/update-settings.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('settings')
@Controller('settings')
@ApiBearerAuth()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get system settings' })
  @ApiResponse({ status: 200, description: 'Returns system settings' })
  get(): Promise<SystemSettings> {
    return this.settingsService.get();
  }

  @Patch()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update system settings (Admin only)' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  update(@Body() data: UpdateSettingsDto): Promise<SystemSettings> {
    return this.settingsService.update(data);
  }
}

