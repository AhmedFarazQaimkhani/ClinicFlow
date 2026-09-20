import { Injectable } from '@nestjs/common';
import { PaymentMethod, TokenStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { AppException } from '../common/filters/app.exception';
import { formatTokenNumber, karachiToday, normalizeTokenQuery, parseClinicDate, toNumber } from '../common/utils/domain';
import { CreateTokenDto } from './dto/token.dto';
import { AuthUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class TokensService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async byDay(clinicId: string, dateInput: string, tokenInput?: string) {
    const tokenDate = parseClinicDate(dateInput);
    if (!tokenDate) {
      throw new AppException('VALIDATION', 'Use date as YYYY-MM-DD (example: 2026-09-18).');
    }
    const tokenNumber = tokenInput?.trim() ? normalizeTokenQuery(tokenInput) : undefined;

    const tokens = await this.prisma.token.findMany({
      where: {
        clinicId,
        tokenDate,
        ...(tokenNumber
          ? {
              OR: [
                { tokenNumber },
                { tokenNumber: { endsWith: tokenNumber } },
                { tokenNumber: { contains: tokenNumber.replace(/^0+/, '') || tokenNumber } },
              ],
            }
          : {}),
      },
      include: {
        patient: true,
        doctor: true,
        visit: {
          include: {
            prescription: { include: { items: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      date: dateInput,
      tokenFilter: tokenNumber ?? null,
      count: tokens.length,
      tokens,
    };
  }

  async preview(clinicId: string) {
    const settings = await this.prisma.clinicSettings.findUnique({
      where: { clinicId },
    });
    const doctor = await this.prisma.doctor.findFirst({
      where: { clinicId, isActive: true, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
    const today = karachiToday();
    const last = await this.prisma.token.findFirst({
      where: { clinicId, tokenDate: today },
      orderBy: { createdAt: 'desc' },
    });
    const next = last ? Number(last.tokenNumber.replace(/\D/g, '')) + 1 : 1;
    return {
      tokenNumber: formatTokenNumber(next, settings?.tokenPrefix ?? ''),
      tokenDate: today,
      consultationFee: toNumber(doctor?.consultationFee ?? settings?.consultationFee),
      paymentTiming: settings?.paymentTiming ?? 'AT_DISPENSING',
    };
  }

  async create(user: AuthUser, dto: CreateTokenDto) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: dto.patientId, clinicId: user.clinicId, deletedAt: null },
    });
    if (!patient) {
      throw new AppException('PATIENT_NOT_FOUND', 'Patient was not found.', 404);
    }

    const doctor = dto.doctorId
      ? await this.prisma.doctor.findFirst({
          where: { id: dto.doctorId, clinicId: user.clinicId, isActive: true },
        })
      : await this.prisma.doctor.findFirst({
          where: { clinicId: user.clinicId, isActive: true, deletedAt: null },
          orderBy: { createdAt: 'asc' },
        });
    if (!doctor) {
      throw new AppException('NO_DOCTOR', 'No active doctor is available.');
    }

    const settings = await this.prisma.clinicSettings.findUnique({
      where: { clinicId: user.clinicId },
    });
    const today = karachiToday();

    const created = await this.prisma.$transaction(async (tx) => {
      const last = await tx.token.findFirst({
        where: { clinicId: user.clinicId, tokenDate: today },
        orderBy: { createdAt: 'desc' },
      });
      const next = last ? Number(last.tokenNumber.replace(/\D/g, '')) + 1 : 1;
      const tokenNumber = formatTokenNumber(next, settings?.tokenPrefix ?? '');

      const token = await tx.token.create({
        data: {
          clinicId: user.clinicId,
          patientId: patient.id,
          doctorId: doctor.id,
          tokenNumber,
          tokenDate: today,
          status: TokenStatus.WAITING,
        },
      });

      const visit = await tx.visit.create({
        data: {
          clinicId: user.clinicId,
          patientId: patient.id,
          doctorId: doctor.id,
          tokenId: token.id,
          status: 'WAITING',
        },
      });

      await tx.token.update({
        where: { id: token.id },
        data: { visitId: visit.id },
      });

      if (dto.payNow && settings?.paymentTiming === 'BEFORE_CONSULTATION') {
        await tx.payment.create({
          data: {
            clinicId: user.clinicId,
            patientId: patient.id,
            visitId: visit.id,
            amount: doctor.consultationFee,
            paymentMethod: (dto.paymentMethod as PaymentMethod) || 'CASH',
            status: 'PAID',
            paidAt: new Date(),
          },
        });
      }

      return tx.token.findUniqueOrThrow({
        where: { id: token.id },
        include: { patient: true, doctor: true, visit: true },
      });
    });

    await this.audit.log({
      clinicId: user.clinicId,
      userId: user.id,
      action: 'token.created',
      entityType: 'token',
      entityId: created.id,
      newValues: { tokenNumber: created.tokenNumber, patientId: patient.id },
    });
    this.realtime.emitClinic(user.clinicId, 'token.created', {
      tokenId: created.id,
      tokenNumber: created.tokenNumber,
    });
    return created;
  }

  async today(clinicId: string, doctorId?: string) {
    const today = karachiToday();
    // Fix stale "with doctor" rows before listing the queue
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
    if (consulting.length > 1) {
      const keepByDoctor = new Map<string, string>();
      for (const token of consulting) {
        if (!keepByDoctor.has(token.doctorId)) keepByDoctor.set(token.doctorId, token.id);
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

    return this.prisma.token.findMany({
      where: {
        clinicId,
        tokenDate: today,
        ...(doctorId ? { doctorId } : {}),
      },
      include: { patient: true, doctor: true, visit: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateStatus(user: AuthUser, id: string, status: TokenStatus) {
    const token = await this.prisma.token.findFirst({
      where: { id, clinicId: user.clinicId },
      include: { visit: true },
    });
    if (!token) {
      throw new AppException('TOKEN_NOT_FOUND', 'Token was not found.', 404);
    }

    const data: {
      status: TokenStatus;
      calledAt?: Date;
      completedAt?: Date;
    } = { status };
    if (status === 'CALLED') data.calledAt = new Date();
    if (status === 'COMPLETED' || status === 'CANCELLED' || status === 'NO_SHOW') {
      data.completedAt = new Date();
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await tx.token.update({
        where: { id: token.id },
        data,
        include: { patient: true, doctor: true, visit: true },
      });
      if (token.visit) {
        const visitStatus =
          status === 'CONSULTING'
            ? 'CONSULTING'
            : status === 'COMPLETED'
              ? 'COMPLETED'
              : status === 'CANCELLED' || status === 'NO_SHOW'
                ? 'CANCELLED'
                : status === 'WAITING' || status === 'CALLED'
                  ? 'WAITING'
                  : token.visit.status;
        await tx.visit.update({
          where: { id: token.visit.id },
          data: {
            status: visitStatus,
            startedAt:
              status === 'CONSULTING'
                ? new Date()
                : status === 'WAITING' || status === 'CALLED'
                  ? null
                  : token.visit.startedAt,
            completedAt:
              status === 'COMPLETED' || status === 'CANCELLED' || status === 'NO_SHOW'
                ? new Date()
                : null,
          },
        });
      }
      return next;
    });

    if (status === 'CANCELLED') {
      await this.audit.log({
        clinicId: user.clinicId,
        userId: user.id,
        action: 'token.cancelled',
        entityType: 'token',
        entityId: token.id,
        oldValues: { status: token.status },
        newValues: { status },
      });
    }

    const event =
      status === 'CALLED'
        ? 'token.called'
        : status === 'CONSULTING'
          ? 'token.started'
          : status === 'COMPLETED'
            ? 'token.completed'
            : 'token.called';
    this.realtime.emitClinic(user.clinicId, event, {
      tokenId: updated.id,
      status,
    });
    return updated;
  }

  async stats(clinicId: string) {
    const today = karachiToday();
    const tokens = await this.prisma.token.findMany({
      where: { clinicId, tokenDate: today },
    });
    const paid = await this.prisma.payment.aggregate({
      where: {
        clinicId,
        status: 'PAID',
        paidAt: { gte: today },
      },
      _sum: { amount: true },
    });
    return {
      waiting: tokens.filter((t) => t.status === 'WAITING' || t.status === 'CALLED').length,
      consulting: tokens.filter((t) => t.status === 'CONSULTING').length,
      completed: tokens.filter((t) => t.status === 'COMPLETED').length,
      collection: Number(paid._sum.amount ?? 0),
      date: today,
    };
  }
}
