import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InmatesModule } from '../inmates/inmates.module';
import { CaseRecord, CaseRecordSchema } from './case.schema';
import { CasesController } from './cases.controller';
import { CasesService } from './cases.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: CaseRecord.name, schema: CaseRecordSchema }]), InmatesModule],
  controllers: [CasesController],
  providers: [CasesService],
  exports: [CasesService],
})
export class CasesModule {}
