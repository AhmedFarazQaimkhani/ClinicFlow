import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AppException } from '../common/filters/app.exception';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { CreateStaffDto } from './dto/staff.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  list(clinicId: string) {
    return this.prisma.user.findMany({
      where: { clinicId, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        canDispense: true,
        lastLoginAt: true,
        createdAt: true,
        doctor: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(user: AuthUser, dto: CreateStaffDto) {
    const passwordHash = await bcrypt.hash(dto.password, 12);
    return this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          clinicId: user.clinicId,
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
          passwordHash,
          role: dto.role,
          canDispense: dto.canDispense || dto.role === 'DISPENSER',
        },
      });
      if (dto.role === 'DOCTOR') {
        await tx.doctor.create({
          data: {
            clinicId: user.clinicId,
            userId: created.id,
            name: dto.name,
            licenseNumber: dto.licenseNumber,
            specialization: dto.specialization ?? 'General Physician',
            consultationFee: dto.consultationFee ?? 1500,
          },
        });
      }
      return tx.user.findUniqueOrThrow({
        where: { id: created.id },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          canDispense: true,
          createdAt: true,
          doctor: true,
        },
      });
    });
  }

  async deactivate(user: AuthUser, id: string) {
    const target = await this.prisma.user.findFirst({
      where: { id, clinicId: user.clinicId },
    });
    if (!target) {
      throw new AppException('NOT_FOUND', 'Staff member was not found.', 404);
    }
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
