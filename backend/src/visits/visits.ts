import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { HydratedDocument, Types } from 'mongoose';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export enum VisitStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  DENIED = 'denied',
  CANCELLED = 'cancelled',
}

export type VisitDocument = HydratedDocument<Visit>;

@Schema({ timestamps: true })
export class Visit {
  @Prop({ type: Types.ObjectId, ref: 'Inmate', required: true, index: true }) inmate: Types.ObjectId;
  @Prop({ required: true, trim: true }) visitorName: string;
  @Prop({ trim: true }) visitorPhone?: string;
  @Prop({ trim: true }) relationship?: string;
  @Prop({ required: true }) visitDate: Date;
  @Prop() durationMinutes?: number;
  @Prop({ required: true, enum: VisitStatus, default: VisitStatus.SCHEDULED }) status: VisitStatus;
  @Prop() notes?: string;
  @Prop({ type: Types.ObjectId, ref: 'User' }) loggedBy?: Types.ObjectId;
  createdAt?: Date;
}
export const VisitSchema = SchemaFactory.createForClass(Visit);

export class CreateVisitDto {
  @ApiProperty({ example: 'Sample Visitor' }) @IsString() @MinLength(2) @MaxLength(100) visitorName: string;
  @ApiPropertyOptional({ example: '08000000001' }) @IsOptional() @IsString() @MaxLength(20) visitorPhone?: string;
  @ApiPropertyOptional({ example: 'Sister' }) @IsOptional() @IsString() @MaxLength(50) relationship?: string;
  @ApiProperty({ example: '2026-11-25T10:00:00.000Z' }) @IsDateString() visitDate: string;
  @ApiPropertyOptional({ example: 30 }) @IsOptional() @IsInt() @Min(5) @Max(240) durationMinutes?: number;
  @ApiPropertyOptional({ enum: VisitStatus }) @IsOptional() @IsEnum(VisitStatus) status?: VisitStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) notes?: string;
}

export class UpdateVisitDto extends PartialType(CreateVisitDto) {}
