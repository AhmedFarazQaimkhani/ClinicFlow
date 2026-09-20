import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clinicName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  prescriptionTemplate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  consultationFee?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(['BEFORE_CONSULTATION', 'AFTER_CONSULTATION', 'AT_DISPENSING'])
  paymentTiming?: 'BEFORE_CONSULTATION' | 'AFTER_CONSULTATION' | 'AT_DISPENSING';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tokenPrefix?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  tokenResetDaily?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  repeatMedicineEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  repeatRequiresDoctorApproval?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  repeatValidityDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  negativeStockAllowed?: boolean;
}
