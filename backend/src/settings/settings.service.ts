import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { UpdateSettingsDto } from './dto/settings.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(clinicId: string) {
    const settings = await this.prisma.clinicSettings.findUnique({
      where: { clinicId },
      include: { clinic: true },
    });
    const doctors = await this.prisma.doctor.findMany({
      where: { clinicId, isActive: true, deletedAt: null },
    });
    return { settings, doctors };
  }

  async update(user: AuthUser, dto: UpdateSettingsDto) {
    const settings = await this.prisma.clinicSettings.update({
      where: { clinicId: user.clinicId },
      data: dto,
    });
    if (dto.consultationFee !== undefined) {
      await this.prisma.doctor.updateMany({
        where: { clinicId: user.clinicId, deletedAt: null },
        data: { consultationFee: dto.consultationFee },
      });
    }
    return settings;
  }
}
