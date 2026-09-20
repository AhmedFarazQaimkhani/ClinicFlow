import { Injectable } from '@nestjs/common';
import { PaymentMethod } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { AppException } from '../common/filters/app.exception';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { CreatePaymentDto } from './dto/payment.dto';
import { karachiToday } from '../common/utils/domain';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async create(user: AuthUser, dto: CreatePaymentDto) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: dto.patientId, clinicId: user.clinicId, deletedAt: null },
    });
    if (!patient) {
      throw new AppException('PATIENT_NOT_FOUND', 'Patient was not found.', 404);
    }
    const payment = await this.prisma.payment.create({
      data: {
        clinicId: user.clinicId,
        patientId: dto.patientId,
        visitId: dto.visitId,
        dispensingId: dto.dispensingId,
        amount: dto.amount,
        paymentMethod: dto.paymentMethod as PaymentMethod,
        status: 'PAID',
        reference: dto.reference,
        paidAt: new Date(),
      },
    });
    await this.audit.log({
      clinicId: user.clinicId,
      userId: user.id,
      action: 'payment.recorded',
      entityType: 'payment',
      entityId: payment.id,
      newValues: { amount: dto.amount },
    });
    this.realtime.emitClinic(user.clinicId, 'payment.completed', {
      paymentId: payment.id,
    });
    return payment;
  }

  async list(clinicId: string) {
    const today = karachiToday();
    return this.prisma.payment.findMany({
      where: { clinicId, createdAt: { gte: today } },
      include: { patient: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async refund(user: AuthUser, id: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, clinicId: user.clinicId },
    });
    if (!payment) {
      throw new AppException('NOT_FOUND', 'Payment was not found.', 404);
    }
    const updated = await this.prisma.payment.update({
      where: { id },
      data: { status: 'REFUNDED' },
    });
    await this.audit.log({
      clinicId: user.clinicId,
      userId: user.id,
      action: 'payment.refunded',
      entityType: 'payment',
      entityId: id,
    });
    return updated;
  }
}
