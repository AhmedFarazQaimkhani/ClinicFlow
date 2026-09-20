import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AppException } from '../common/filters/app.exception';
import type { AuthUser } from '../common/decorators/current-user.decorator';

interface AccessPayload {
  sub: string;
  clinicId: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET || 'change-me-access',
    });
  }

  async validate(payload: AccessPayload): Promise<AuthUser> {
    const user = await this.prisma.user.findFirst({
      where: {
        id: payload.sub,
        clinicId: payload.clinicId,
        isActive: true,
        deletedAt: null,
      },
    });
    if (!user) {
      throw new AppException('UNAUTHORIZED', 'Please log in again.', 401);
    }
    return {
      id: user.id,
      clinicId: user.clinicId,
      role: user.role,
      name: user.name,
      canDispense: user.canDispense || user.role === 'DISPENSER',
    };
  }
}
