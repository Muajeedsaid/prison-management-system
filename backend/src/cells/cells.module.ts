import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InmatesModule } from '../inmates/inmates.module';
import { Cell, CellSchema, Transfer, TransferSchema } from './cell.schema';
import { CellsController } from './cells.controller';
import { CellsService } from './cells.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Cell.name, schema: CellSchema },
      { name: Transfer.name, schema: TransferSchema },
    ]),
    InmatesModule,
  ],
  controllers: [CellsController],
  providers: [CellsService],
  exports: [CellsService],
})
export class CellsModule {}
