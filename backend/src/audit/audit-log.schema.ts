import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AuditLogDocument = HydratedDocument<AuditLog>;

/** Append-only record of who did what. There is deliberately no update or delete endpoint for this. */
@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class AuditLog {
  @Prop() userId?: string;
  @Prop() userEmail?: string;
  @Prop() role?: string;
  @Prop({ required: true }) method: string;
  @Prop({ required: true }) path: string;
  @Prop({ required: true }) statusCode: number;
  @Prop() ip?: string;
  @Prop({ type: Object }) body?: Record<string, unknown>;
  @Prop() createdAt?: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ userEmail: 1, createdAt: -1 });
