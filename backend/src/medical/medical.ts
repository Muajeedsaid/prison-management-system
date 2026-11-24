import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HydratedDocument, Types } from 'mongoose';
import { IsDateString, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export enum MedicalType {
  CHECK_UP = 'check-up',
  TREATMENT = 'treatment',
  REFERRAL = 'referral',
  EMERGENCY = 'emergency',
}

export type MedicalRecordDocument = HydratedDocument<MedicalRecord>;

@Schema({ timestamps: true })
export class MedicalRecord {
  @Prop({ type: Types.ObjectId, ref: 'Inmate', required: true, index: true }) inmate: Types.ObjectId;
  @Prop({ required: true, enum: MedicalType }) type: MedicalType;
  @Prop({ required: true, trim: true }) diagnosis: string;
  @Prop({ trim: true }) treatment?: string;
  @Prop() notes?: string;
  @Prop({ default: () => new Date() }) recordedAt: Date;
  @Prop({ type: Types.ObjectId, ref: 'User' }) recordedBy?: Types.ObjectId;
}
export const MedicalRecordSchema = SchemaFactory.createForClass(MedicalRecord);

export class CreateMedicalRecordDto {
  @ApiProperty({ enum: MedicalType }) @IsEnum(MedicalType) type: MedicalType;
  @ApiProperty({ example: 'Seasonal malaria' }) @IsString() @MinLength(2) @MaxLength(300) diagnosis: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) treatment?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) notes?: string;
  @ApiPropertyOptional({ example: '2026-11-20T09:00:00.000Z' }) @IsOptional() @IsDateString() recordedAt?: string;
}
