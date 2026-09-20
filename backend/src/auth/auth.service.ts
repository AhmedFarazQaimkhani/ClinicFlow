import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AppException } from '../common/filters/app.exception';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const identifier = dto.identifier.trim();
    const user = await this.prisma.user.findFirst({
      where: {
        isActive: true,
        deletedAt: null,
        OR: [
          { email: { equals: identifier, mode: 'insensitive' } },
          { phone: identifier },
        ],
      },
      include: { clinic: true, doctor: true },
    });
    if (!user || !user.clinic.isActive) {
      throw new AppException('INVALID_LOGIN', 'Phone/email or password is wrong.');
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new AppException('INVALID_LOGIN', 'Phone/email or password is wrong.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.issueTokens(user.id, user.clinicId, user.role);
    return {
      ...tokens,
      user: {
        id: user.id,
        clinicId: user.clinicId,
        name: user.name,
        role: user.role,
        canDispense: user.canDispense || user.role === 'DISPENSER',
        doctorId: user.doctor?.id ?? null,
        clinicName: user.clinic.name,
      },
    };
  }

  async refresh(refreshToken: string) {
    const tokenHash = hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: { include: { doctor: true, clinic: true } } },
    });
    if (!stored || !stored.user.isActive) {
      throw new AppException('UNAUTHORIZED', 'Please log in again.', 401);
    }
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });
    const tokens = await this.issueTokens(
      stored.user.id,
      stored.user.clinicId,
      stored.user.role,
    );
    return {
      ...tokens,
      user: {
        id: stored.user.id,
        clinicId: stored.user.clinicId,
        name: stored.user.name,
        role: stored.user.role,
        canDispense:
          stored.user.canDispense || stored.user.role === 'DISPENSER',
        doctorId: stored.user.doctor?.id ?? null,
        clinicName: stored.user.clinic.name,
      },
    };
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({
        where: { userId, tokenHash: hashToken(refreshToken), revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } else {
      await this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    return { loggedOut: true };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { clinic: true, doctor: true },
    });
    if (!user) {
      throw new AppException('UNAUTHORIZED', 'Please log in again.', 401);
    }
    return {
      id: user.id,
      clinicId: user.clinicId,
      name: user.name,
      role: user.role,
      canDispense: user.canDispense || user.role === 'DISPENSER',
      doctorId: user.doctor?.id ?? null,
      clinicName: user.clinic.name,
    };
  }

  private async issueTokens(userId: string, clinicId: string, role: string) {
    const accessToken = await this.jwt.signAsync(
      { sub: userId, clinicId, role },
      {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: '15m',
      },
    );
    const refreshToken = randomBytes(48).toString('hex');
    await this.prisma.refreshToken.create({
      data: {
        clinicId,
        userId,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    return { accessToken, refreshToken };
  }
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}
