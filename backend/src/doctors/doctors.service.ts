import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppException } from '../common/filters/app.exception';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { UpdateDoctorFeeDto } from './dto/doctor.dto';
import { toNumber } from '../common/utils/domain';

@Injectable()
export class DoctorsService {
  constructor(private readonly prisma: PrismaService) {}

  list(clinicId: string) {
    return this.prisma.doctor.findMany({
      where: { clinicId, deletedAt: null },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async me(user: AuthUser) {
    const doctor = await this.prisma.doctor.findFirst({
      where: { clinicId: user.clinicId, userId: user.id, deletedAt: null },
    });
    if (!doctor) {
      throw new AppException('NO_DOCTOR', 'Doctor profile was not found.', 404);
    }
    return {
      ...doctor,
      consultationFee: toNumber(doctor.consultationFee),
    };
  }

  async updateMyFee(user: AuthUser, dto: UpdateDoctorFeeDto) {
    const doctor = await this.prisma.doctor.findFirst({
      where: { clinicId: user.clinicId, userId: user.id, deletedAt: null },
    });
    if (!doctor) {
      throw new AppException('NO_DOCTOR', 'Doctor profile was not found.', 404);
    }
    return this.applyFee(user.clinicId, doctor.id, dto.consultationFee);
  }

  async updateFee(user: AuthUser, doctorId: string, dto: UpdateDoctorFeeDto) {
    const doctor = await this.prisma.doctor.findFirst({
      where: { id: doctorId, clinicId: user.clinicId, deletedAt: null },
    });
    if (!doctor) {
      throw new AppException('NO_DOCTOR', 'Doctor was not found.', 404);
    }
    return this.applyFee(user.clinicId, doctor.id, dto.consultationFee);
  }

  private async applyFee(clinicId: string, doctorId: string, consultationFee: number) {
    const [doctor] = await this.prisma.$transaction([
      this.prisma.doctor.update({
        where: { id: doctorId },
        data: { consultationFee },
      }),
      this.prisma.clinicSettings.update({
        where: { clinicId },
        data: { consultationFee },
      }),
    ]);
    return {
      ...doctor,
      consultationFee: toNumber(doctor.consultationFee),
    };
  }
}
