import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    clinicId: string;
    userId?: string | null;
    action: string;
    entityType: string;
    entityId: string;
    oldValues?: Prisma.InputJsonValue;
    newValues?: Prisma.InputJsonValue;
  }) {
    await this.prisma.auditLog.create({
      data: {
        clinicId: params.clinicId,
        userId: params.userId ?? null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        oldValues: params.oldValues,
        newValues: params.newValues,
      },
    });
  }
}
