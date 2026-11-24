import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum InmateStatus {
  AWAITING_TRIAL = 'awaiting-trial',
  CONVICTED = 'convicted',
  RELEASED = 'released',
  TRANSFERRED_OUT = 'transferred-out',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

@Schema({ _id: false })
export class NextOfKin {
  @Prop({ required: true, trim: true }) name: string;
  @Prop({ required: true, trim: true }) phone: string;
  @Prop({ trim: true }) relationship?: string;
}
const NextOfKinSchema = SchemaFactory.createForClass(NextOfKin);

export type InmateDocument = HydratedDocument<Inmate>;

@Schema({ timestamps: true })
export class Inmate {
  /** Human-friendly unique number such as INM-2026-0001 */
  @Prop({ required: true, unique: true }) inmateNumber: string;
  @Prop({ required: true, trim: true, index: true }) fullName: string;
  @Prop({ required: true }) dateOfBirth: Date;
  @Prop({ required: true, enum: Gender }) gender: Gender;
  @Prop({ required: true, enum: InmateStatus, default: InmateStatus.AWAITING_TRIAL, index: true }) status: InmateStatus;
  @Prop({ required: true }) admissionDate: Date;
  @Prop() sentenceMonths?: number;
  @Prop() expectedReleaseDate?: Date;
  @Prop() actualReleaseDate?: Date;
  @Prop({ type: Types.ObjectId, ref: 'Cell', default: null, index: true }) cell?: Types.ObjectId | null;
  @Prop({ type: NextOfKinSchema }) nextOfKin?: NextOfKin;
  /** Only a reference to the photo is stored in MongoDB. The file itself lives in file storage. */
  @Prop() photoUrl?: string;
  /** Soft delete: records are archived, never erased, so history survives. */
  @Prop({ default: false, index: true }) isArchived: boolean;
  @Prop({ type: Types.ObjectId, ref: 'User' }) registeredBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export const InmateSchema = SchemaFactory.createForClass(Inmate);
