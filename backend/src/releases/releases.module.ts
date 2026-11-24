import {
  Body,
  ConflictException,
  Controller,
  Get,
  Injectable,
  Module,
  Param,
  Post,
  Query,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectModel, MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { HydratedDocument, Model, Types } from 'mongoose';
import { AuthUser, CurrentUser, Roles } from '../common/decorators';
import { buildMeta, PaginationQuery } from '../common/pagination';
import { ParseObjectIdPipe } from '../common/parse-object-id.pipe';
import { Role } from '../common/roles';
import { InmatesModule } from '../inmates/inmates.module';
import { InmatesService } from '../inmates/inmates.service';

export enum ReleaseReason {
  SENTENCE_COMPLETED = 'sentence-completed',
  BAIL = 'bail',
  ACQUITTAL = 'acquittal',
  PARDON = 'pardon',
  TRANSFER = 'transfer',
}

export type ReleaseDocument = HydratedDocument<Release>;

@Schema({ timestamps: true })
export class Release {
  /** unique: an inmate can only be released once */
  @Prop({ type: Types.ObjectId, ref: 'Inmate', required: true, unique: true }) inmate: Types.ObjectId;
  @Prop({ required: true }) releaseDate: Date;
  @Prop({ required: true, enum: ReleaseReason }) reason: ReleaseReason;
  @Prop() notes?: string;
  @Prop({ type: Types.ObjectId, ref: 'User' }) approvedBy?: Types.ObjectId;
  createdAt?: Date;
}
export const ReleaseSchema = SchemaFactory.createForClass(Release);

export class CreateReleaseDto {
  @ApiProperty({ example: '2026-11-30' }) @IsDateString() releaseDate: string;
  @ApiProperty({ enum: ReleaseReason }) @IsEnum(ReleaseReason) reason: ReleaseReason;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) notes?: string;
}

@Injectable()
export class ReleasesService {
  constructor(
    @InjectModel(Release.name) private model: Model<ReleaseDocument>,
    private inmates: InmatesService,
  ) {}

  async release(inmateId: string, dto: CreateReleaseDto, userId: string) {
    const inmate = await this.inmates.getActive(inmateId); // 409 if already released
    if (new Date(dto.releaseDate) < inmate.admissionDate) {
      throw new UnprocessableEntityException('Release date cannot be before the admission date');
    }
    if (await this.model.exists({ inmate: inmateId })) {
      throw new ConflictException('This inmate already has a release record');
    }
    const record = await this.model.create({ ...dto, inmate: inmateId, approvedBy: userId });
    await this.inmates.markReleased(inmateId, new Date(dto.releaseDate));
    return record;
  }

  async list(query: PaginationQuery) {
    const [data, total] = await Promise.all([
      this.model
        .find()
        .sort({ releaseDate: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .populate('inmate', 'inmateNumber fullName')
        .populate('approvedBy', 'fullName')
        .lean(),
      this.model.countDocuments(),
    ]);
    return { data, meta: buildMeta(query.page, query.limit, total) };
  }
}

@ApiTags('Releases')
@ApiBearerAuth()
@Controller()
export class ReleasesController {
  constructor(private service: ReleasesService) {}

  @Post('inmates/:id/release')
  @Roles(Role.CONTROLLER)
  @ApiOperation({ summary: 'Process a release (Facility Controller). Frees the cell and closes the record.' })
  release(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: CreateReleaseDto, @CurrentUser() user: AuthUser) {
    return this.service.release(id, dto, user.id);
  }

  @Get('releases')
  @Roles(Role.CONTROLLER, Role.RECORDS)
  @ApiOperation({ summary: 'List releases' })
  list(@Query() query: PaginationQuery) {
    return this.service.list(query);
  }
}

@Module({
  imports: [MongooseModule.forFeature([{ name: Release.name, schema: ReleaseSchema }]), InmatesModule],
  controllers: [ReleasesController],
  providers: [ReleasesService],
})
export class ReleasesModule {}
