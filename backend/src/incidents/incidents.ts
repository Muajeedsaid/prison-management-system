import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HydratedDocument, Types } from 'mongoose';
import { IsDateString, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export enum IncidentType {
  FIGHT = 'fight',
  CONTRABAND = 'contraband',
  ESCAPE_ATTEMPT = 'escape-attempt',
  INJURY = 'injury',
  MISCONDUCT = 'misconduct',
  OTHER = 'other',
}

export enum Severity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export type IncidentDocument = HydratedDocument<Incident>;

@Schema({ timestamps: true })
export class Incident {
  @Prop({ type: Types.ObjectId, ref: 'Inmate', required: true, index: true }) inmate: Types.ObjectId;
  @Prop({ required: true, enum: IncidentType }) type: IncidentType;
  @Prop({ required: true, enum: Severity, default: Severity.LOW }) severity: Severity;
  @Prop({ required: true }) description: string;
  @Prop() actionTaken?: string;
  @Prop({ default: () => new Date(), index: true }) occurredAt: Date;
  @Prop({ type: Types.ObjectId, ref: 'User' }) reportedBy?: Types.ObjectId;
  createdAt?: Date;
}
export const IncidentSchema = SchemaFactory.createForClass(Incident);

export class CreateIncidentDto {
  @ApiProperty({ enum: IncidentType }) @IsEnum(IncidentType) type: IncidentType;
  @ApiPropertyOptional({ enum: Severity }) @IsOptional() @IsEnum(Severity) severity?: Severity;
  @ApiProperty({ example: 'Argument in the yard' }) @IsString() @MinLength(5) @MaxLength(1000) description: string;
  @ApiPropertyOptional({ example: 'Separated and warned' }) @IsOptional() @IsString() @MaxLength(500) actionTaken?: string;
  @ApiPropertyOptional({ example: '2026-11-20T14:00:00.000Z' }) @IsOptional() @IsDateString() occurredAt?: string;
}
