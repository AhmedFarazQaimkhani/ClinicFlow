import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { AppException } from '../common/filters/app.exception';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { UpdateVisitDto } from './dto/visit.dto';
import { karachiToday } from '../common/utils/domain';

@Injectable()
export class VisitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async doctorToday(user: AuthUser, doctorId: string) {
    let resolvedDoctorId = doctorId;
    if (!resolvedDoctorId) {
      const doctor = await this.prisma.doctor.findFirst({
        where: { clinicId: user.clinicId, userId: user.id },
      });
      resolvedDoctorId = doctor?.id ?? '';
    }
    if (!resolvedDoctorId) {
      throw new AppException('NO_DOCTOR', 'Doctor profile was not found.');
    }
    doctorId = resolvedDoctorId;
    await this.repairStuckConsulting(user.clinicId, doctorId);

    const today = karachiToday();
    const waiting = await this.prisma.token.findMany({
      where: {
        clinicId: user.clinicId,
        doctorId,
        tokenDate: today,
        status: { in: ['WAITING', 'CALLED'] },
      },
      include: { patient: true, visit: true },
      orderBy: { createdAt: 'asc' },
    });
    const consulting = await this.prisma.token.findFirst({
      where: {
        clinicId: user.clinicId,
        doctorId,
        tokenDate: today,
        status: 'CONSULTING',
      },
      include: { patient: true, visit: true },
      orderBy: { calledAt: 'desc' },
    });
    const patients = await this.prisma.token.findMany({
      where: { clinicId: user.clinicId, doctorId, tokenDate: today },
      include: { patient: true, visit: true },
      orderBy: { createdAt: 'asc' },
    });
    return {
      waitingCount: waiting.length,
      next: waiting[0] ?? null,
      current: consulting,
      today: patients,
    };
  }

  /** Keep at most one CONSULTING token per doctor; unfinished ones go back to waiting. */
  async repairStuckConsulting(clinicId: string, doctorId?: string) {
    const today = karachiToday();
    const consulting = await this.prisma.token.findMany({
      where: {
        clinicId,
        tokenDate: today,
        status: 'CONSULTING',
        ...(doctorId ? { doctorId } : {}),
      },
      include: { visit: true },
      orderBy: [{ calledAt: 'desc' }, { createdAt: 'desc' }],
    });
    if (consulting.length <= 1) return;

    // Group by doctor — keep newest per doctor
    const keepByDoctor = new Map<string, string>();
    for (const token of consulting) {
      if (!keepByDoctor.has(token.doctorId)) {
        keepByDoctor.set(token.doctorId, token.id);
      }
    }

    for (const token of consulting) {
      if (keepByDoctor.get(token.doctorId) === token.id) continue;
      const hasRx = token.visit
        ? await this.prisma.prescription.findFirst({
            where: { visitId: token.visit.id, status: { not: 'CANCELLED' } },
          })
        : null;
      if (hasRx) {
        await this.prisma.token.update({
          where: { id: token.id },
          data: { status: 'COMPLETED', completedAt: new Date() },
        });
        if (token.visit) {
          await this.prisma.visit.update({
            where: { id: token.visit.id },
            data: { status: 'PRESCRIPTION_READY', completedAt: new Date() },
          });
        }
      } else {
        await this.prisma.token.update({
          where: { id: token.id },
          data: { status: 'WAITING', calledAt: null },
        });
        if (token.visit) {
          await this.prisma.visit.update({
            where: { id: token.visit.id },
            data: { status: 'WAITING', startedAt: null },
          });
        }
      }
    }
  }

  async start(user: AuthUser, visitId: string) {
    const visit = await this.scopedVisit(user.clinicId, visitId);
    if (['COMPLETED', 'CANCELLED', 'PRESCRIPTION_READY'].includes(visit.status)) {
      throw new AppException('INVALID_STATE', 'This visit is already finished.');
    }

    const today = karachiToday();
    const updated = await this.prisma.$transaction(async (tx) => {
      // Only one patient can be with the doctor. Release other unfinished CONSULTING tokens.
      const stuck = await tx.token.findMany({
        where: {
          clinicId: user.clinicId,
          doctorId: visit.doctorId,
          tokenDate: today,
          status: 'CONSULTING',
          id: { not: visit.tokenId },
        },
        include: { visit: true },
      });
      for (const token of stuck) {
        const hasRx = token.visit
          ? await tx.prescription.findFirst({
              where: { visitId: token.visit.id, status: { not: 'CANCELLED' } },
            })
          : null;
        if (hasRx) {
          await tx.token.update({
            where: { id: token.id },
            data: { status: 'COMPLETED', completedAt: new Date() },
          });
          if (token.visit) {
            await tx.visit.update({
              where: { id: token.visit.id },
              data: { status: 'PRESCRIPTION_READY', completedAt: new Date() },
            });
          }
        } else {
          await tx.token.update({
            where: { id: token.id },
            data: { status: 'WAITING', calledAt: null },
          });
          if (token.visit) {
            await tx.visit.update({
              where: { id: token.visit.id },
              data: { status: 'WAITING', startedAt: null },
            });
          }
        }
      }

      const next = await tx.visit.update({
        where: { id: visit.id },
        data: { status: 'CONSULTING', startedAt: new Date() },
        include: { patient: true, doctor: true, token: true, prescription: { include: { items: true } } },
      });
      await tx.token.update({
        where: { id: visit.tokenId },
        data: { status: 'CONSULTING', calledAt: visit.token.calledAt ?? new Date() },
      });
      return next;
    });
    this.realtime.emitClinic(user.clinicId, 'token.started', {
      visitId: updated.id,
      tokenId: updated.tokenId,
    });
    return updated;
  }

  async update(user: AuthUser, visitId: string, dto: UpdateVisitDto) {
    const visit = await this.scopedVisit(user.clinicId, visitId);
    return this.prisma.visit.update({
      where: { id: visit.id },
      data: dto,
      include: { patient: true, doctor: true, token: true, prescription: { include: { items: true } } },
    });
  }

  async findOne(clinicId: string, visitId: string) {
    return this.scopedVisit(clinicId, visitId);
  }

  private async scopedVisit(clinicId: string, visitId: string) {
    const visit = await this.prisma.visit.findFirst({
      where: { id: visitId, clinicId },
      include: {
        patient: true,
        doctor: true,
        token: true,
        prescription: { include: { items: true } },
        payments: true,
      },
    });
    if (!visit) {
      throw new AppException('VISIT_NOT_FOUND', 'Visit was not found.', 404);
    }
    return visit;
  }
}
