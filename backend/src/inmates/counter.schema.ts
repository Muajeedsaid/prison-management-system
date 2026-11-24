import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CounterDocument = HydratedDocument<Counter>;

/** Atomic counter used to hand out inmate numbers without duplicates, even under concurrent requests. */
@Schema({ collection: 'counters' })
export class Counter {
  @Prop({ type: String, required: true }) _id: string;
  @Prop({ default: 0 }) seq: number;
}

export const CounterSchema = SchemaFactory.createForClass(Counter);
