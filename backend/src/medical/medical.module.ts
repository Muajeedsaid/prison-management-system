import { Body, Controller, Get, Injectable, Module, Param, Post } from '@nestjs/common';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Model } from 'mongoose';
import { AuthUser, CurrentUser, Roles } from '../common/decorators';
import { ParseObjectIdPipe } from '../common/parse-object-id.pipe';
import { Role } from '../common/roles';
import { InmatesModule } from '../inmates/inmates.module';
import { InmatesService } from '../inmates/inmates.service';
import { CreateMedicalRecordDto, MedicalRecord, MedicalRecordDocument, MedicalRecordSchema } from './medical';

@Injectable()
export class MedicalService {
  constructor(
    @InjectModel(MedicalRecord.name) private model: Model<MedicalRecordDocument>,
    private inmates: InmatesService,
  ) {}

  async create(inmateId: string, dto: CreateMedicalRecordDto, userId: string) {
    await this.inmates.getRaw(inmateId); // medical care continues for any registered inmate
    return this.model.create({ ...dto, inmate: inmateId, recordedBy: userId });
  }

  async findByInmate(inmateId: string) {
    await this.inmates.getRaw(inmateId);
    return this.model
      .find({ inmate: inmateId })
      .sort({ recordedAt: -1 })
      .populate('recordedBy', 'fullName')
      .lean();
  }
}

/** Medical data is the most private data in the system: only the Medical Officer and the Controller can read it. */
@ApiTags('Medical')
@ApiBearerAuth()
@Controller('inmates/:id/medical-records')
export class MedicalController {
  constructor(private service: MedicalService) {}

  @Get()
  @Roles(Role.MEDICAL, Role.CONTROLLER)
  @ApiOperation({ summary: 'Medical history of an inmate' })
  findByInmate(@Param('id', ParseObjectIdPipe) id: string) {
    return this.service.findByInmate(id);
  }

  @Post()
  @Roles(Role.MEDICAL)
  @ApiOperation({ summary: 'Add a medical record (Medical Officer)' })
  create(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: CreateMedicalRecordDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.create(id, dto, user.id);
  }
}

@Module({
  imports: [MongooseModule.forFeature([{ name: MedicalRecord.name, schema: MedicalRecordSchema }]), InmatesModule],
  controllers: [MedicalController],
  providers: [MedicalService],
})
export class MedicalModule {}
