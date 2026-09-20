import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddPrescriptionItemDto {
  @ApiProperty()
  @IsString()
  medicineId!: string;

  @ApiProperty()
  @IsString()
  dose!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  doseQuantity!: number;

  @ApiProperty()
  @IsString()
  frequency!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  frequencyPerDay!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  durationDays!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instructions?: string;
}

export class SaveConsultationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  complaint?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  diagnosis?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clinicalNotes?: string;

  @ApiPropertyOptional({ type: [AddPrescriptionItemDto] })
  @IsOptional()
  items?: AddPrescriptionItemDto[];
}
