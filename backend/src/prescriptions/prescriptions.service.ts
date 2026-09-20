import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { AppException } from '../common/filters/app.exception';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { AddPrescriptionItemDto, SaveConsultationDto } from './dto/prescription.dto';
import {
  calculateMedicineQuantity,
  formatPrescriptionNumber,
  toNumber,
} from '../common/utils/domain';

@Injectable()
export class PrescriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async saveAndSend(user: AuthUser, visitId: string, dto: SaveConsultationDto) {
    const visit = await this.prisma.visit.findFirst({
      where: { id: visitId, clinicId: user.clinicId },
      include: { prescription: { include: { items: true } }, patient: true, token: true },
    });
    if (!visit) {
      throw new AppException('VISIT_NOT_FOUND', 'Visit was not found.', 404);
    }
    if (!dto.items?.length) {
      throw new AppException('VALIDATION', 'Add at least one medicine.');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.visit.update({
        where: { id: visit.id },
        data: {
          complaint: dto.complaint,
          diagnosis: dto.diagnosis,
          clinicalNotes: dto.clinicalNotes,
          status: 'PRESCRIPTION_READY',
        },
      });

      let prescription = visit.prescription;
      if (!prescription) {
        const seq = await tx.clinicSequence.upsert({
          where: { clinicId: user.clinicId },
          update: { lastPrescriptionNumber: { increment: 1 } },
          create: {
            clinicId: user.clinicId,
            lastPrescriptionNumber: 1,
          },
        });
        prescription = await tx.prescription.create({
          data: {
            clinicId: user.clinicId,
            patientId: visit.patientId,
            visitId: visit.id,
            doctorId: visit.doctorId,
            prescriptionNumber: formatPrescriptionNumber(seq.lastPrescriptionNumber),
            status: 'READY',
          },
          include: { items: true },
        });
      } else {
        await tx.prescriptionItem.deleteMany({ where: { prescriptionId: prescription.id } });
        prescription = await tx.prescription.update({
          where: { id: prescription.id },
          data: { status: 'READY' },
          include: { items: true },
        });
      }

      for (const item of dto.items ?? []) {
        await this.addItemTx(tx, user.clinicId, prescription.id, item);
      }

      await tx.dispensing.create({
        data: {
          clinicId: user.clinicId,
          patientId: visit.patientId,
          prescriptionId: prescription.id,
          type: 'NEW_PRESCRIPTION',
          status: 'PENDING',
        },
      });

      await tx.token.update({
        where: { id: visit.tokenId },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });

      return tx.prescription.findUniqueOrThrow({
        where: { id: prescription.id },
        include: {
          items: true,
          patient: true,
          doctor: true,
          visit: { include: { token: true } },
        },
      });
    });

    await this.audit.log({
      clinicId: user.clinicId,
      userId: user.id,
      action: 'prescription.created',
      entityType: 'prescription',
      entityId: result.id,
      newValues: { prescriptionNumber: result.prescriptionNumber },
    });
    this.realtime.emitClinic(user.clinicId, 'prescription.ready', {
      prescriptionId: result.id,
      patientName: result.patient.name,
    });
    return result;
  }

  async findOne(clinicId: string, id: string) {
    const rx = await this.prisma.prescription.findFirst({
      where: { id, clinicId },
      include: {
        items: true,
        patient: true,
        doctor: true,
        visit: { include: { token: true, payments: true } },
        dispensings: { include: { items: true, payments: true } },
      },
    });
    if (!rx) {
      throw new AppException('NOT_FOUND', 'Prescription was not found.', 404);
    }
    return rx;
  }

  async latestForPatient(clinicId: string, patientId: string) {
    const rx = await this.prisma.prescription.findFirst({
      where: { clinicId, patientId, status: { not: 'CANCELLED' } },
      include: { items: true, doctor: true, patient: true },
      orderBy: { createdAt: 'desc' },
    });
    if (!rx) {
      throw new AppException('NOT_FOUND', 'No previous prescription found.', 404);
    }
    return rx;
  }

  private async addItemTx(
    tx: Prisma.TransactionClient,
    clinicId: string,
    prescriptionId: string,
    dto: AddPrescriptionItemDto,
  ) {
    const medicine = await tx.medicine.findFirst({
      where: { id: dto.medicineId, clinicId, isActive: true, deletedAt: null },
    });
    if (!medicine) {
      throw new AppException('MEDICINE_NOT_FOUND', 'Medicine was not found.');
    }
    const quantity =
      dto.quantity ??
      calculateMedicineQuantity(
        dto.doseQuantity,
        dto.frequencyPerDay,
        dto.durationDays,
      );
    return tx.prescriptionItem.create({
      data: {
        prescriptionId,
        medicineId: medicine.id,
        medicineNameSnapshot: medicine.name,
        genericNameSnapshot: medicine.genericName,
        strengthSnapshot: medicine.strength,
        formSnapshot: medicine.form,
        dose: dto.dose,
        doseQuantity: dto.doseQuantity,
        frequency: dto.frequency,
        frequencyPerDay: dto.frequencyPerDay,
        durationDays: dto.durationDays,
        quantity,
        instructions: dto.instructions,
      },
    });
  }
}

export function snapshotPrice(price: unknown) {
  return toNumber(price);
}
