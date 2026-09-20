import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RepeatMedicineDto {
  @ApiProperty()
  @IsString()
  patientId!: string;

  @ApiProperty()
  @IsString()
  prescriptionId!: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  itemIds!: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(['CASH', 'CARD', 'BANK_TRANSFER', 'JAZZCASH', 'EASYPAISA', 'OTHER'])
  paymentMethod?: string;
}

export class CompleteDispensingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(['CASH', 'CARD', 'BANK_TRANSFER', 'JAZZCASH', 'EASYPAISA', 'OTHER'])
  paymentMethod?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  consultationAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reference?: string;
}

export class ReviewRepeatDto {
  @ApiProperty({ enum: ['APPROVED', 'REJECTED'] })
  @IsIn(['APPROVED', 'REJECTED'])
  status!: 'APPROVED' | 'REJECTED';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
