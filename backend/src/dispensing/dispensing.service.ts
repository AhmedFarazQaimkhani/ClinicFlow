import { Injectable } from '@nestjs/common';
import { PaymentMethod, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { AppException } from '../common/filters/app.exception';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { CompleteDispensingDto, RepeatMedicineDto, ReviewRepeatDto } from './dto/dispensing.dto';
import { karachiToday, toNumber } from '../common/utils/domain';

@Injectable()
export class DispensingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async readyQueue(clinicId: string) {
    return this.prisma.dispensing.findMany({
      where: { clinicId, status: 'PENDING' },
      include: {
        patient: true,
        items: true,
        prescription: {
          include: {
            items: true,
            visit: { include: { token: true, payments: true, doctor: true } },
            doctor: true,
          },
        },
        payments: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(clinicId: string, id: string) {
    const row = await this.prisma.dispensing.findFirst({
      where: { id, clinicId },
      include: {
        patient: true,
        items: true,
        payments: true,
        prescription: {
          include: {
            items: true,
            visit: { include: { token: true, payments: true, doctor: true } },
            doctor: true,
          },
        },
      },
    });
    if (!row) {
      throw new AppException('NOT_FOUND', 'Dispensing record was not found.', 404);
    }
    return row;
  }

  async complete(user: AuthUser, id: string, dto: CompleteDispensingDto) {
    this.assertCanDispense(user);
    const existing = await this.findOne(user.clinicId, id);
    if (existing.status !== 'PENDING') {
      throw new AppException('INVALID_STATE', 'This medicine is already processed.');
    }

    const settings = await this.prisma.clinicSettings.findUnique({
      where: { clinicId: user.clinicId },
    });
    const items = existing.prescription.items;
    if (!items.length) {
      throw new AppException('VALIDATION', 'No medicines to give.');
    }

    const completed = await this.prisma.$transaction(async (tx) => {
      await this.deductStock(tx, user.clinicId, items, settings?.negativeStockAllowed ?? false);

      for (const item of items) {
        await tx.dispensingItem.create({
          data: {
            dispensingId: existing.id,
            prescriptionItemId: item.id,
            medicineId: item.medicineId,
            quantity: item.quantity,
            unitPrice: 0,
            totalPrice: 0,
          },
        });
      }

      const dispensing = await tx.dispensing.update({
        where: { id: existing.id },
        data: {
          status: 'DISPENSED',
          dispensedById: user.id,
          dispensedAt: new Date(),
        },
        include: { items: true, patient: true, prescription: true },
      });

      if ((dto.consultationAmount ?? 0) > 0) {
        await tx.payment.create({
          data: {
            clinicId: user.clinicId,
            patientId: existing.patientId,
            visitId: existing.prescription.visitId,
            amount: dto.consultationAmount ?? 0,
            paymentMethod: (dto.paymentMethod as PaymentMethod) || 'CASH',
            status: 'PAID',
            paidAt: new Date(),
          },
        });
      }

      if (existing.type === 'NEW_PRESCRIPTION') {
        await tx.prescription.update({
          where: { id: existing.prescriptionId },
          data: { status: 'DISPENSED' },
        });
        await tx.visit.update({
          where: { id: existing.prescription.visitId },
          data: { status: 'COMPLETED', completedAt: new Date() },
        });
      }

      return dispensing;
    });

    await this.audit.log({
      clinicId: user.clinicId,
      userId: user.id,
      action: 'medicine.dispensed',
      entityType: 'dispensing',
      entityId: existing.id,
      newValues: { type: existing.type },
    });
    this.realtime.emitClinic(user.clinicId, 'dispensing.completed', {
      dispensingId: existing.id,
    });
    this.realtime.emitClinic(user.clinicId, 'payment.completed', {
      patientId: existing.patientId,
    });
    return completed;
  }

  /**
   * Repeat previous medicines without creating a token or visit.
   */
  async repeat(user: AuthUser, dto: RepeatMedicineDto) {
    this.assertCanDispense(user);
    const settings = await this.prisma.clinicSettings.findUnique({
      where: { clinicId: user.clinicId },
    });
    if (!settings?.repeatMedicineEnabled) {
      throw new AppException('REPEAT_DISABLED', 'Repeat medicine is turned off.');
    }

    const prescription = await this.prisma.prescription.findFirst({
      where: {
        id: dto.prescriptionId,
        clinicId: user.clinicId,
        patientId: dto.patientId,
      },
      include: { items: true, patient: true },
    });
    if (!prescription) {
      throw new AppException('NOT_FOUND', 'Previous prescription was not found.', 404);
    }

    const validityDays = settings.repeatValidityDays ?? 30;
    const ageDays =
      (Date.now() - prescription.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays > validityDays) {
      throw new AppException(
        'REPEAT_EXPIRED',
        `This prescription is older than ${validityDays} days. See the doctor.`,
      );
    }

    const selected = prescription.items.filter((item) => dto.itemIds.includes(item.id));
    if (!selected.length) {
      throw new AppException('VALIDATION', 'Select at least one medicine.');
    }

    if (settings.repeatRequiresDoctorApproval) {
      const request = await this.prisma.repeatRequest.create({
        data: {
          clinicId: user.clinicId,
          patientId: dto.patientId,
          prescriptionId: prescription.id,
          requestedById: user.id,
          itemIds: dto.itemIds,
          status: 'PENDING',
        },
        include: { patient: true, prescription: { include: { items: true } } },
      });
      this.realtime.emitClinic(user.clinicId, 'repeat.requested', {
        requestId: request.id,
      });
      return { requiresApproval: true, request };
    }

    return this.executeRepeat(user, prescription, selected);
  }

  async pendingRepeats(clinicId: string) {
    return this.prisma.repeatRequest.findMany({
      where: { clinicId, status: 'PENDING' },
      include: {
        patient: true,
        prescription: { include: { items: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async reviewRepeat(user: AuthUser, id: string, dto: ReviewRepeatDto) {
    const request = await this.prisma.repeatRequest.findFirst({
      where: { id, clinicId: user.clinicId, status: 'PENDING' },
      include: { prescription: { include: { items: true } } },
    });
    if (!request) {
      throw new AppException('NOT_FOUND', 'Repeat request was not found.', 404);
    }
    await this.prisma.repeatRequest.update({
      where: { id },
      data: {
        status: dto.status,
        reviewedById: user.id,
        reviewedAt: new Date(),
        notes: dto.notes,
      },
    });
    if (dto.status === 'REJECTED') {
      return { status: 'REJECTED' };
    }
    const selected = request.prescription.items.filter((item) =>
      request.itemIds.includes(item.id),
    );
    const result = await this.executeRepeat(
      user,
      { ...request.prescription, patientId: request.patientId },
      selected,
    );
    this.realtime.emitClinic(user.clinicId, 'repeat.approved', { requestId: id });
    return result;
  }

  private async executeRepeat(
    user: AuthUser,
    prescription: { id: string; patientId: string },
    selected: Array<{
      id: string;
      medicineId: string;
      quantity: number;
    }>,
  ) {
    const settings = await this.prisma.clinicSettings.findUnique({
      where: { clinicId: user.clinicId },
    });

    const visitCountBefore = await this.prisma.visit.count({
      where: { clinicId: user.clinicId, patientId: prescription.patientId },
    });
    const tokenCountBefore = await this.prisma.token.count({
      where: { clinicId: user.clinicId, patientId: prescription.patientId },
    });

    const result = await this.prisma.$transaction(async (tx) => {
      await this.deductStock(
        tx,
        user.clinicId,
        selected,
        settings?.negativeStockAllowed ?? false,
      );

      const dispensing = await tx.dispensing.create({
        data: {
          clinicId: user.clinicId,
          patientId: prescription.patientId,
          prescriptionId: prescription.id,
          type: 'REPEAT',
          status: 'DISPENSED',
          dispensedById: user.id,
          dispensedAt: new Date(),
        },
      });

      for (const item of selected) {
        await tx.dispensingItem.create({
          data: {
            dispensingId: dispensing.id,
            prescriptionItemId: item.id,
            medicineId: item.medicineId,
            quantity: item.quantity,
            unitPrice: 0,
            totalPrice: 0,
          },
        });
      }

      return tx.dispensing.findUniqueOrThrow({
        where: { id: dispensing.id },
        include: { items: true, payments: true, patient: true },
      });
    });

    const visitCountAfter = await this.prisma.visit.count({
      where: { clinicId: user.clinicId, patientId: prescription.patientId },
    });
    const tokenCountAfter = await this.prisma.token.count({
      where: { clinicId: user.clinicId, patientId: prescription.patientId },
    });
    if (visitCountAfter !== visitCountBefore || tokenCountAfter !== tokenCountBefore) {
      throw new AppException(
        'REPEAT_INTEGRITY',
        'Repeat medicine must not create a visit or token.',
      );
    }

    await this.audit.log({
      clinicId: user.clinicId,
      userId: user.id,
      action: 'medicine.dispensed',
      entityType: 'dispensing',
      entityId: result.id,
      newValues: { type: 'REPEAT' },
    });
    this.realtime.emitClinic(user.clinicId, 'dispensing.created', {
      dispensingId: result.id,
      type: 'REPEAT',
    });
    this.realtime.emitClinic(user.clinicId, 'dispensing.completed', {
      dispensingId: result.id,
    });
    return { requiresApproval: false, dispensing: result };
  }

  private async deductStock(
    tx: Prisma.TransactionClient,
    clinicId: string,
    items: Array<{ medicineId: string; quantity: number }>,
    negativeAllowed: boolean,
  ) {
    for (const item of items) {
      const medicine = await tx.medicine.findFirst({
        where: { id: item.medicineId, clinicId },
      });
      if (!medicine) {
        throw new AppException('MEDICINE_NOT_FOUND', 'Medicine was not found.');
      }
      if (!negativeAllowed && medicine.stockQuantity < item.quantity) {
        throw new AppException(
          'INSUFFICIENT_STOCK',
          `Not enough stock for ${medicine.name}.`,
        );
      }
      await tx.medicine.update({
        where: { id: medicine.id },
        data: { stockQuantity: { decrement: item.quantity } },
      });
    }
  }

  private async unitPrice(tx: Prisma.TransactionClient, medicineId: string) {
    const medicine = await tx.medicine.findUnique({ where: { id: medicineId } });
    return toNumber(medicine?.sellingPrice);
  }

  private assertCanDispense(user: AuthUser) {
    if (
      user.role !== 'OWNER' &&
      user.role !== 'DISPENSER' &&
      user.role !== 'RECEPTIONIST' &&
      !user.canDispense
    ) {
      throw new AppException('FORBIDDEN', 'You cannot give medicines.', 403);
    }
  }

  todayCollection(clinicId: string) {
    const today = karachiToday();
    return this.prisma.payment.aggregate({
      where: { clinicId, status: 'PAID', paidAt: { gte: today } },
      _sum: { amount: true },
    });
  }
}
