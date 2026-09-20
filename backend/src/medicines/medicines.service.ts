import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AppException } from '../common/filters/app.exception';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { UpsertMedicineDto } from './dto/medicine.dto';

@Injectable()
export class MedicinesService {
  constructor(private readonly prisma: PrismaService) {}

  async search(clinicId: string, q?: string) {
    const where: Prisma.MedicineWhereInput = {
      clinicId,
      deletedAt: null,
      isActive: true,
    };
    if (q?.trim()) {
      where.OR = [
        { name: { contains: q.trim(), mode: 'insensitive' } },
        { genericName: { contains: q.trim(), mode: 'insensitive' } },
      ];
    }
    return this.prisma.medicine.findMany({
      where,
      orderBy: { name: 'asc' },
      take: 50,
    });
  }

  async listAll(clinicId: string) {
    return this.prisma.medicine.findMany({
      where: { clinicId, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async create(user: AuthUser, dto: UpsertMedicineDto) {
    return this.prisma.medicine.create({
      data: {
        clinicId: user.clinicId,
        name: dto.name.trim(),
        genericName: dto.genericName,
        strength: dto.strength,
        form: dto.form,
        unit: dto.unit ?? 'Tablet',
        sellingPrice: dto.sellingPrice,
        stockQuantity: dto.stockQuantity ?? 0,
        lowStockThreshold: dto.lowStockThreshold ?? 10,
      },
    });
  }

  async update(user: AuthUser, id: string, dto: UpsertMedicineDto) {
    const medicine = await this.prisma.medicine.findFirst({
      where: { id, clinicId: user.clinicId, deletedAt: null },
    });
    if (!medicine) {
      throw new AppException('MEDICINE_NOT_FOUND', 'Medicine was not found.', 404);
    }
    return this.prisma.medicine.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        genericName: dto.genericName,
        strength: dto.strength,
        form: dto.form,
        unit: dto.unit,
        sellingPrice: dto.sellingPrice,
        stockQuantity: dto.stockQuantity,
        lowStockThreshold: dto.lowStockThreshold,
        isActive: dto.isActive,
      },
    });
  }

  async favorites(clinicId: string, doctorId: string) {
    return this.prisma.doctorFavoriteMedicine.findMany({
      where: { clinicId, doctorId },
      include: { medicine: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async addFavorite(user: AuthUser, doctorId: string, medicineId: string) {
    return this.prisma.doctorFavoriteMedicine.upsert({
      where: { doctorId_medicineId: { doctorId, medicineId } },
      update: {},
      create: { clinicId: user.clinicId, doctorId, medicineId },
      include: { medicine: true },
    });
  }

  async removeFavorite(clinicId: string, doctorId: string, medicineId: string) {
    await this.prisma.doctorFavoriteMedicine.deleteMany({
      where: { clinicId, doctorId, medicineId },
    });
    return { removed: true };
  }

  async remove(user: AuthUser, id: string) {
    const medicine = await this.prisma.medicine.findFirst({
      where: { id, clinicId: user.clinicId, deletedAt: null },
    });
    if (!medicine) {
      throw new AppException('MEDICINE_NOT_FOUND', 'Medicine was not found.', 404);
    }
    await this.prisma.doctorFavoriteMedicine.deleteMany({
      where: { clinicId: user.clinicId, medicineId: id },
    });
    return this.prisma.medicine.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
