import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AppException } from '../common/filters/app.exception';
import { formatPatientNumber, mrnDigits, normalizePhone } from '../common/utils/domain';
import { CreatePatientDto, UpdatePatientDto } from './dto/patient.dto';
import { AuthUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class PatientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async search(clinicId: string, q?: string) {
    const where: Prisma.PatientWhereInput = {
      clinicId,
      deletedAt: null,
    };
    if (q?.trim()) {
      const term = q.trim();
      const digits = mrnDigits(term);
      const looksLikeMrn =
        /^p-?\d+$/i.test(term.replace(/\s/g, '')) ||
        /^mrn-?\d+$/i.test(term.replace(/\s/g, '')) ||
        (/^\d+$/.test(term) && term.length <= 6);

      const mrnFilters: Prisma.PatientWhereInput[] = [];
      if (digits) {
        const padded = digits.padStart(6, '0').slice(-6);
        mrnFilters.push(
          { patientNumber: { equals: `P-${padded}`, mode: 'insensitive' } },
          { patientNumber: { endsWith: padded } },
        );
        if (digits.length >= 3) {
          mrnFilters.push({ patientNumber: { contains: digits, mode: 'insensitive' } });
        }
      }

      if (looksLikeMrn) {
        where.OR = mrnFilters.length ? mrnFilters : [{ patientNumber: { contains: term, mode: 'insensitive' } }];
      } else {
        where.OR = [
          { name: { contains: term, mode: 'insensitive' } },
          { phone: { contains: term.replace(/[\s-]/g, '') } },
          ...mrnFilters,
        ];
      }
    }
    const rows = await this.prisma.patient.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 40,
    });
    const digits = termDigits(q);
    if (!digits) return rows;
    return [...rows].sort((a, b) => {
      const aScore = mrnScore(a.patientNumber, digits);
      const bScore = mrnScore(b.patientNumber, digits);
      return bScore - aScore;
    });
  }

  async create(user: AuthUser, dto: CreatePatientDto) {
    const name = dto.name.trim();
    if (!name) {
      throw new AppException('VALIDATION', 'Patient name is required.');
    }
    const patient = await this.prisma.$transaction(async (tx) => {
      const seq = await tx.clinicSequence.upsert({
        where: { clinicId: user.clinicId },
        update: { lastPatientNumber: { increment: 1 } },
        create: { clinicId: user.clinicId, lastPatientNumber: 1 },
      });
      return tx.patient.create({
        data: {
          clinicId: user.clinicId,
          patientNumber: formatPatientNumber(seq.lastPatientNumber),
          name,
          phone: normalizePhone(dto.phone),
          age: dto.age,
          gender: dto.gender,
          address: dto.address?.trim(),
        },
      });
    });
    await this.audit.log({
      clinicId: user.clinicId,
      userId: user.id,
      action: 'patient.created',
      entityType: 'patient',
      entityId: patient.id,
      newValues: { name: patient.name, patientNumber: patient.patientNumber },
    });
    return patient;
  }

  async findOne(clinicId: string, id: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { id, clinicId, deletedAt: null },
    });
    if (!patient) {
      throw new AppException('PATIENT_NOT_FOUND', 'Patient was not found.', 404);
    }
    return patient;
  }

  async update(user: AuthUser, id: string, dto: UpdatePatientDto) {
    const existing = await this.findOne(user.clinicId, id);
    const updated = await this.prisma.patient.update({
      where: { id: existing.id },
      data: {
        name: dto.name?.trim(),
        phone: dto.phone !== undefined ? normalizePhone(dto.phone) : undefined,
        age: dto.age,
        gender: dto.gender,
        address: dto.address?.trim(),
        notes: dto.notes,
      },
    });
    await this.audit.log({
      clinicId: user.clinicId,
      userId: user.id,
      action: 'patient.updated',
      entityType: 'patient',
      entityId: id,
      oldValues: { name: existing.name },
      newValues: { name: updated.name },
    });
    return updated;
  }

  async history(clinicId: string, id: string) {
    const patient = await this.findOne(clinicId, id);
    const [visits, repeats] = await Promise.all([
      this.prisma.visit.findMany({
        where: { clinicId, patientId: id, status: { not: 'CANCELLED' } },
        include: {
          doctor: true,
          token: true,
          prescription: { include: { items: true } },
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.dispensing.findMany({
        where: { clinicId, patientId: id, type: 'REPEAT' },
        include: {
          items: true,
          payments: true,
          prescription: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const events = [
      ...visits.map((visit) => ({
        kind: 'CONSULTATION' as const,
        at: visit.createdAt,
        visit,
      })),
      ...repeats.map((dispensing) => ({
        kind: 'MEDICINE_REPEAT' as const,
        at: dispensing.createdAt,
        dispensing,
      })),
    ].sort((a, b) => b.at.getTime() - a.at.getTime());

    return { patient, events };
  }
}

function termDigits(q?: string): string {
  if (!q?.trim()) return '';
  return q.replace(/\D/g, '');
}

function mrnScore(patientNumber: string, digits: string): number {
  const pn = patientNumber.replace(/\D/g, '');
  if (pn === digits.padStart(6, '0') || pn === digits) return 100;
  if (pn.endsWith(digits)) return 50;
  if (pn.includes(digits)) return 20;
  return 0;
}
