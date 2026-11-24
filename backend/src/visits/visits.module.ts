import { Body, Controller, Get, Injectable, Module, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Model } from 'mongoose';
import { AuthUser, CurrentUser, Roles } from '../common/decorators';
import { ParseObjectIdPipe } from '../common/parse-object-id.pipe';
import { Role } from '../common/roles';
import { InmatesModule } from '../inmates/inmates.module';
import { InmatesService } from '../inmates/inmates.service';
import { CreateVisitDto, UpdateVisitDto, Visit, VisitDocument, VisitSchema } from './visits';

@Injectable()
export class VisitsService {
  constructor(
    @InjectModel(Visit.name) private model: Model<VisitDocument>,
    private inmates: InmatesService,
  ) {}

  async create(inmateId: string, dto: CreateVisitDto, userId: string) {
    await this.inmates.getActive(inmateId);
    return this.model.create({ ...dto, inmate: inmateId, loggedBy: userId });
  }

  async findByInmate(inmateId: string) {
    await this.inmates.getRaw(inmateId);
    return this.model.find({ inmate: inmateId }).sort({ visitDate: -1 }).lean();
  }

  async update(id: string, dto: UpdateVisitDto) {
    const visit = await this.model.findByIdAndUpdate(id, dto, { new: true }).lean();
    if (!visit) throw new NotFoundException('Visit not found');
    return visit;
  }
}

@ApiTags('Visits')
@ApiBearerAuth()
@Controller()
export class VisitsController {
  constructor(private service: VisitsService) {}

  @Get('inmates/:id/visits')
  @Roles(Role.VISITOR_DESK, Role.CONTROLLER)
  @ApiOperation({ summary: 'Visit log of an inmate' })
  findByInmate(@Param('id', ParseObjectIdPipe) id: string) {
    return this.service.findByInmate(id);
  }

  @Post('inmates/:id/visits')
  @Roles(Role.VISITOR_DESK)
  @ApiOperation({ summary: 'Schedule or log a visit (Visitor Desk Officer)' })
  create(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: CreateVisitDto, @CurrentUser() user: AuthUser) {
    return this.service.create(id, dto, user.id);
  }

  @Patch('visits/:id')
  @Roles(Role.VISITOR_DESK)
  @ApiOperation({ summary: 'Approve, deny, complete or cancel a visit' })
  update(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateVisitDto) {
    return this.service.update(id, dto);
  }
}

@Module({
  imports: [MongooseModule.forFeature([{ name: Visit.name, schema: VisitSchema }]), InmatesModule],
  controllers: [VisitsController],
  providers: [VisitsService],
})
export class VisitsModule {}
