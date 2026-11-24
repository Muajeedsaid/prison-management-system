import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InmatesService } from '../inmates/inmates.service';
import { CaseRecord, CaseRecordDocument, CaseStatus } from './case.schema';
import { CreateCaseDto, UpdateCaseDto } from './cases.dto';

@Injectable()
export class CasesService {
  constructor(
    @InjectModel(CaseRecord.name) private model: Model<CaseRecordDocument>,
    private inmates: InmatesService,
  ) {}

  async create(inmateId: string, dto: CreateCaseDto, userId: string) {
    await this.inmates.getActive(inmateId);
    return this.model.create({ ...dto, inmate: inmateId, createdBy: userId });
  }

  async findByInmate(inmateId: string) {
    await this.inmates.getRaw(inmateId);
    return this.model.find({ inmate: inmateId }).sort({ createdAt: -1 }).lean();
  }

  async findOne(id: string) {
    const found = await this.model.findById(id).populate('inmate', 'inmateNumber fullName').lean();
    if (!found) throw new NotFoundException('Case not found');
    return found;
  }

  async update(id: string, dto: UpdateCaseDto) {
    const current = await this.model.findById(id);
    if (!current) throw new NotFoundException('Case not found');
    const status = dto.status ?? current.status;
    const judgment = dto.judgment ?? current.judgment;
    // Business rule: a case cannot be closed without recording the judgment.
    if (status === CaseStatus.CLOSED && !judgment) {
      throw new UnprocessableEntityException('Record the judgment before closing a case');
    }
    Object.assign(current, dto);
    await current.save();
    return current.toObject();
  }

  /** Court dates coming up in the next `days` days, for warnings on the dashboard. */
  upcoming(days = 14) {
    const now = new Date();
    const end = new Date(now.getTime() + days * 86_400_000);
    return this.model
      .find({ status: { $ne: CaseStatus.CLOSED }, nextCourtDate: { $gte: now, $lte: end } })
      .sort({ nextCourtDate: 1 })
      .limit(50)
      .populate('inmate', 'inmateNumber fullName')
      .lean();
  }
}
