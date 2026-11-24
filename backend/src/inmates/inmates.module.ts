import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Counter, CounterSchema } from './counter.schema';
import { Inmate, InmateSchema } from './inmate.schema';
import { InmatesController } from './inmates.controller';
import { InmatesService } from './inmates.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Inmate.name, schema: InmateSchema },
      { name: Counter.name, schema: CounterSchema },
    ]),
  ],
  controllers: [InmatesController],
  providers: [InmatesService],
  exports: [InmatesService],
})
export class InmatesModule {}
