import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { karachiToday, toNumber } from '../common/utils/domain';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async daily(clinicId: string, date = karachiToday()) {
    const next = new Date(date);
    next.setUTCDate(next.getUTCDate() + 1);

    const [visits, repeats, payments, tokens] = await Promise.all([
      this.prisma.visit.count({
        where: {
          clinicId,
          createdAt: { gte: date, lt: next },
          status: { not: 'CANCELLED' },
        },
      }),
      this.prisma.dispensing.count({
        where: {
          clinicId,
          type: 'REPEAT',
          createdAt: { gte: date, lt: next },
        },
      }),
      this.prisma.payment.findMany({
        where: { clinicId, paidAt: { gte: date, lt: next } },
      }),
      this.prisma.token.count({
        where: { clinicId, tokenDate: date, status: { not: 'CANCELLED' } },
      }),
    ]);

    const paid = payments.filter((p) => p.status === 'PAID');
    const pending = payments.filter((p) => p.status === 'PENDING');
    const consultation = paid
      .filter((p) => p.visitId && !p.dispensingId)
      .reduce((sum, p) => sum + toNumber(p.amount), 0);
    const medicine = paid
      .filter((p) => p.dispensingId)
      .reduce((sum, p) => sum + toNumber(p.amount), 0);
    const mixedConsult = paid
      .filter((p) => p.visitId && p.dispensingId)
      .reduce((sum, p) => sum + toNumber(p.amount), 0);

    return {
      date,
      totalPatients: tokens,
      doctorConsultations: visits,
      medicineRepeats: repeats,
      consultationRevenue: consultation,
      medicineRevenue: medicine + mixedConsult,
      totalRevenue: paid.reduce((sum, p) => sum + toNumber(p.amount), 0),
      pendingPayments: pending.reduce((sum, p) => sum + toNumber(p.amount), 0),
    };
  }

  async monthly(clinicId: string, year: number, month: number) {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const rows = [];
    for (let day = 1; day <= days; day += 1) {
      const date = new Date(Date.UTC(year, month - 1, day));
      rows.push(await this.daily(clinicId, date));
    }
    return {
      year,
      month,
      days: rows,
      totals: rows.reduce(
        (acc, row) => ({
          totalPatients: acc.totalPatients + row.totalPatients,
          doctorConsultations: acc.doctorConsultations + row.doctorConsultations,
          medicineRepeats: acc.medicineRepeats + row.medicineRepeats,
          consultationRevenue: acc.consultationRevenue + row.consultationRevenue,
          medicineRevenue: acc.medicineRevenue + row.medicineRevenue,
          totalRevenue: acc.totalRevenue + row.totalRevenue,
          pendingPayments: acc.pendingPayments + row.pendingPayments,
        }),
        {
          totalPatients: 0,
          doctorConsultations: 0,
          medicineRepeats: 0,
          consultationRevenue: 0,
          medicineRevenue: 0,
          totalRevenue: 0,
          pendingPayments: 0,
        },
      ),
    };
  }

  async medicines(clinicId: string) {
    const items = await this.prisma.dispensingItem.findMany({
      where: { dispensing: { clinicId, status: 'DISPENSED' } },
      include: { medicine: true },
    });
    const map = new Map<
      string,
      { medicine: string; quantity: number; revenue: number; stock: number }
    >();
    for (const item of items) {
      const current = map.get(item.medicineId) ?? {
        medicine: item.medicine.name,
        quantity: 0,
        revenue: 0,
        stock: item.medicine.stockQuantity,
      };
      current.quantity += item.quantity;
      current.revenue += toNumber(item.totalPrice);
      map.set(item.medicineId, current);
    }
    return [...map.values()].sort((a, b) => b.quantity - a.quantity);
  }

  async ownerToday(clinicId: string) {
    const daily = await this.daily(clinicId);
    return daily;
  }
}
