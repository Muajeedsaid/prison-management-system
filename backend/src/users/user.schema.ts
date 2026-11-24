import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Role } from '../common/roles';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true }) fullName: string;
  @Prop({ required: true, unique: true, lowercase: true, trim: true }) email: string;
  /** bcrypt hash. `select: false` keeps it out of normal queries and API responses. */
  @Prop({ required: true, select: false }) password: string;
  @Prop({ required: true, enum: Role }) role: Role;
  @Prop({ default: true }) isActive: boolean;
  @Prop({ select: false }) refreshTokenHash?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
