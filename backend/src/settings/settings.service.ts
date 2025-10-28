import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto, SystemSettings } from './dto/update-settings.dto';

const DEFAULT_SETTINGS = {
  libraryName: 'Smart Library',
  fineRatePerDay: 50,
  borrowLimit: 3,
  reservationLimit: 1,
  maxBorrowingDays: 14,
  maxRenewals: 3,
  renewalDays: 7,
  notificationEmailEnabled: true,
  autoApproveReservations: false,
  maintenanceMode: false,
};

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async get(): Promise<SystemSettings> {
    // Get all settings from the database
    const configs = await this.prisma.systemConfig.findMany();
    
    const settings: SystemSettings = { ...DEFAULT_SETTINGS };
    
    // Merge database settings with defaults
    configs.forEach((config) => {
      // Try to parse JSON values, fallback to string
      try {
        settings[config.key] = JSON.parse(config.value);
      } catch {
        settings[config.key] = config.value;
      }
    });

    return settings;
  }

  async update(data: UpdateSettingsDto): Promise<SystemSettings> {
    const updatedSettings: SystemSettings = { ...DEFAULT_SETTINGS };

    // Update or create each setting
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== null) {
        await this.prisma.systemConfig.upsert({
          where: { key },
          update: {
            value: JSON.stringify(value),
            updatedAt: new Date(),
          },
          create: {
            key,
            value: JSON.stringify(value),
          },
        });
        updatedSettings[key] = value;
      }
    }

    // Fetch and return all current settings
    return this.get();
  }

  async getByKey(key: string): Promise<string | null> {
    const config = await this.prisma.systemConfig.findUnique({
      where: { key },
    });
    return config ? config.value : null;
  }

  async deleteByKey(key: string): Promise<void> {
    await this.prisma.systemConfig.delete({
      where: { key },
    });
  }
}

