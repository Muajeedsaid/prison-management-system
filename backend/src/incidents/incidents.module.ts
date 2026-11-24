import { Body, Controller, Get, Injectable, Module, Param, Post, Query } from '@nestjs/common';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Model } from 'mongoose';
import { AuthUser, CurrentUser, Roles } from '../common/decorators';
import { ParseObjectIdPipe } from '../common/parse-object-id.pipe';
import { buildMeta, PaginationQuery } from '../common/pagination';
import { Role } from '../common/roles';
import { InmatesModule } from '../inmates/inmates.module';
import { InmatesService } from '../inmates/inmates.service';
import { CreateIncidentDto, Incident, IncidentDocument, IncidentSchema } from './incidents';

@Injectable()
export class IncidentsService {
  constructor(
    @InjectModel(Incident.name) private model: Model<IncidentDocument>,
    private inmates: InmatesService,
  ) {}

  async create(inmateId: string, dto: CreateIncidentDto, userId: string) {
    await this.inmates.getRaw(inmateId);
    return this.model.create({ ...dto, inmate: inmateId, reportedBy: userId });
  }

  async findByInmate(inmateId: string) {
    await this.inmates.getRaw(inmateId);
    return this.model.find({ inmate: inmateId }).sort({ occurredAt: -1 }).populate('reportedBy', 'fullName').lean();
  }

  async recent(query: PaginationQuery) {
    const [data, total] = await Promise.all([
      this.model
        .find()
        .sort({ occurredAt: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .populate('inmate', 'inmateNumber fullName')
        .lean(),
      this.model.countDocuments(),
    ]);
    return { data, meta: buildMeta(query.page, query.limit, total) };
  }
}

@ApiTags('Incidents')
@ApiBearerAuth()
@Controller()
export class IncidentsController {
  constructor(private service: IncidentsService) {}

  @Get('incidents')
  @Roles(Role.CONTROLLER, Role.CELL)
  @ApiOperation({ summary: 'Most recent incidents across the facility' })
  recent(@Query() query: PaginationQuery) {
    return this.service.recent(query);
  }

  @Get('inmates/:id/incidents')
  @Roles(Role.CONTROLLER, Role.CELL)
  @ApiOperation({ summary: 'Incidents involving one inmate' })
  findByInmate(@Param('id', ParseObjectIdPipe) id: string) {
    return this.service.findByInmate(id);
  }

  @Post('inmates/:id/incidents')
  @Roles(Role.CELL)
  @ApiOperation({ summary: 'File an incident report (Cell Officer)' })
  create(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: CreateIncidentDto, @CurrentUser() user: AuthUser) {
    return this.service.create(id, dto, user.id);
  }
}

@Module({
  imports: [MongooseModule.forFeature([{ name: Incident.name, schema: IncidentSchema }]), InmatesModule],
  controllers: [IncidentsController],
  providers: [IncidentsService],
})
export class IncidentsModule {}
