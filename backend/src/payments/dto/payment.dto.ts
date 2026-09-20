import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty()
  @IsString()
  patientId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  visitId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dispensingId?: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiProperty()
  @IsIn(['CASH', 'CARD', 'BANK_TRANSFER', 'JAZZCASH', 'EASYPAISA', 'OTHER'])
  paymentMethod!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reference?: string;
}
