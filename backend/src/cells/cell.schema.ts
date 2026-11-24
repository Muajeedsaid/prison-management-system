import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CellDocument = HydratedDocument<Cell>;

@Schema({ timestamps: true })
export class Cell {
  @Prop({ required: true, trim: true }) block: string;
  @Prop({ required: true, trim: true }) name: string;
  @Prop({ required: true, min: 1 }) capacity: number;
  @Prop({ default: true }) isActive: boolean;
}
export const CellSchema = SchemaFactory.createForClass(Cell);
CellSchema.index({ block: 1, name: 1 }, { unique: true });

export type TransferDocument = HydratedDocument<Transfer>;

/** History of cell moves. A transfer with no fromCell is the first allocation. */
@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Transfer {
  @Prop({ type: Types.ObjectId, ref: 'Inmate', required: true, index: true }) inmate: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Cell', default: null }) fromCell?: Types.ObjectId | null;
  @Prop({ type: Types.ObjectId, ref: 'Cell', required: true }) toCell: Types.ObjectId;
  @Prop() reason?: string;
  @Prop({ type: Types.ObjectId, ref: 'User' }) transferredBy?: Types.ObjectId;
  createdAt?: Date;
}
export const TransferSchema = SchemaFactory.createForClass(Transfer);
