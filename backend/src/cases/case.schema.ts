import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum CaseStatus {
  OPEN = 'open',
  ADJOURNED = 'adjourned',
  CLOSED = 'closed',
}

export type CaseRecordDocument = HydratedDocument<CaseRecord>;

@Schema({ _id: false })
export class Bail {
  @Prop({ default: false }) granted: boolean;
  @Prop() amount?: number;
}
const BailSchema = SchemaFactory.createForClass(Bail);

/** A legal case against an inmate. Stored in the `caserecords` collection. */
@Schema({ timestamps: true })
export class CaseRecord {
  @Prop({ type: Types.ObjectId, ref: 'Inmate', required: true, index: true }) inmate: Types.ObjectId;
  @Prop({ required: true, trim: true }) caseNumber: string;
  @Prop({ type: [String], default: [] }) charges: string[];
  @Prop({ trim: true }) court?: string;
  @Prop({ index: true }) nextCourtDate?: Date;
  @Prop({ required: true, enum: CaseStatus, default: CaseStatus.OPEN }) status: CaseStatus;
  @Prop({ type: BailSchema }) bail?: Bail;
  @Prop() judgment?: string;
  @Prop() sentenceMonths?: number;
  @Prop({ type: Types.ObjectId, ref: 'User' }) createdBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}
export const CaseRecordSchema = SchemaFactory.createForClass(CaseRecord);
