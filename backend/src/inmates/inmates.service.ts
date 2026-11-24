import { ConflictException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { buildMeta, escapeRegex, parseSort } from '../common/pagination';
import { Counter, CounterDocument } from './counter.schema';
import { Inmate, InmateDocument, InmateStatus } from './inmate.schema';
import { CreateInmateDto, ListInmatesQuery, UpdateInmateDto } from './inmates.dto';

const SORTABLE = ['fullName', 'inmateNumber', 'admissionDate', 'expectedReleaseDate', 'createdAt'];
const CELL_FIELDS = 'name block capacity';

@Injectable()
export class InmatesService {
  constructor(
    @InjectModel(Inmate.name) private model: Model<InmateDocument>,
    @InjectModel(Counter.name) private counters: Model<CounterDocument>,
  ) {}

  async create(dto: CreateInmateDto, userId: string) {
    this.checkDates(dto.admissionDate, dto.expectedReleaseDate);
    if (dto.status === InmateStatus.RELEASED) {
      throw new UnprocessableEntityException('A new inmate cannot be registered as released');
    }
    const year = new Date().getFullYear();
    const seq = await this.nextSeq(`inmate-${year}`);
    const inmateNumber = `INM-${year}-${String(seq).padStart(4, '0')}`;
    const doc = await this.model.create({ ...dto, inmateNumber, registeredBy: userId });
    return this.findOne(doc.id);
  }

  async findAll(query: ListInmatesQuery) {
    const filter: Record<string, unknown> = { isArchived: false };
    if (query.status) filter.status = query.status;
    if (query.cell) filter.cell = new Types.ObjectId(query.cell);
    if (query.search) {
      const rx = new RegExp(escapeRegex(query.search.trim()), 'i');
      filter.$or = [{ fullName: rx }, { inmateNumber: rx }];
    }
    const sort = parseSort(query.sort, SORTABLE, { createdAt: -1 });
    const [data, total] = await Promise.all([
      this.model
        .find(filter)
        .sort(sort)
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .populate('cell', CELL_FIELDS)
        .lean(),
      this.model.countDocuments(filter),
    ]);
    return { data, meta: buildMeta(query.page, query.limit, total) };
  }

  async findOne(id: string) {
    const inmate = await this.model.findOne({ _id: id, isArchived: false }).populate('cell', CELL_FIELDS).lean();
    if (!inmate) throw new NotFoundException('Inmate not found');
    return inmate;
  }

  async update(id: string, dto: UpdateInmateDto) {
    const current = await this.getRaw(id);
    if (dto.status === InmateStatus.RELEASED) {
      throw new UnprocessableEntityException('Use POST /inmates/:id/release to release an inmate');
    }
    if (current.status === InmateStatus.RELEASED) {
      throw new ConflictException('A released inmate record can no longer be edited');
    }
    this.checkDates(
      dto.admissionDate ?? current.admissionDate.toISOString(),
      dto.expectedReleaseDate ?? current.expectedReleaseDate?.toISOString(),
    );
    await this.model.updateOne({ _id: id }, dto);
    return this.findOne(id);
  }

  /** Soft delete. The record stays in the database for history and audits. */
  async archive(id: string) {
    const res = await this.model.updateOne({ _id: id, isArchived: false }, { isArchived: true, cell: null });
    if (res.matchedCount === 0) throw new NotFoundException('Inmate not found');
  }

  // ---- helpers used by other modules (cases, visits, cells, releases, reports) ----

  /** Returns the inmate (as a Mongoose document) or throws 404. */
  async getRaw(id: string) {
    const inmate = await this.model.findOne({ _id: id, isArchived: false });
    if (!inmate) throw new NotFoundException('Inmate not found');
    return inmate;
  }

  /** Same as getRaw but also refuses released inmates (cannot be moved, visited, etc.). */
  async getActive(id: string) {
    const inmate = await this.getRaw(id);
    if (inmate.status === InmateStatus.RELEASED) {
      throw new ConflictException('This inmate has already been released');
    }
    return inmate;
  }

  setCell(id: string, cellId: string | null) {
    return this.model.updateOne({ _id: id }, { cell: cellId });
  }

  async markReleased(id: string, releaseDate: Date) {
    await this.model.updateOne(
      { _id: id },
      { status: InmateStatus.RELEASED, actualReleaseDate: releaseDate, cell: null },
    );
  }

  countInCell(cellId: string) {
    return this.model.countDocuments({ cell: new Types.ObjectId(cellId), isArchived: false });
  }

  findByCell(cellId: string) {
    return this.model
      .find({ cell: new Types.ObjectId(cellId), isArchived: false })
      .select('inmateNumber fullName status')
      .lean();
  }

  /** { cellId: occupantCount } for every occupied cell. */
  async occupancyByCell(): Promise<Record<string, number>> {
    const rows = await this.model.aggregate([
      { $match: { isArchived: false, cell: { $ne: null } } },
      { $group: { _id: '$cell', count: { $sum: 1 } } },
    ]);
    return Object.fromEntries(rows.map((r) => [String(r._id), r.count as number]));
  }

  async countByStatus(): Promise<Record<string, number>> {
    const rows = await this.model.aggregate([
      { $match: { isArchived: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    return Object.fromEntries(rows.map((r) => [r._id as string, r.count as number]));
  }

  /** Admissions per calendar month for the last `months` months, oldest first. */
  async admissionsByMonth(months = 6) {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    start.setMonth(start.getMonth() - (months - 1));
    const rows = await this.model.aggregate([
      { $match: { isArchived: false, admissionDate: { $gte: start } } },
      { $group: { _id: { y: { $year: '$admissionDate' }, m: { $month: '$admissionDate' } }, count: { $sum: 1 } } },
    ]);
    const counts = new Map(rows.map((r) => [`${r._id.y}-${r._id.m}`, r.count as number]));
    const out: { month: string; count: number }[] = [];
    for (let i = 0; i < months; i++) {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
      out.push({
        month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        count: counts.get(`${d.getFullYear()}-${d.getMonth() + 1}`) ?? 0,
      });
    }
    return out;
  }

  /** Inmates whose expected release date falls within the next `days` days (sentence-end alerts). */
  upcomingReleases(days = 30) {
    const now = new Date();
    const end = new Date(now.getTime() + days * 86_400_000);
    return this.model
      .find({
        isArchived: false,
        status: { $ne: InmateStatus.RELEASED },
        expectedReleaseDate: { $gte: now, $lte: end },
      })
      .sort({ expectedReleaseDate: 1 })
      .select('inmateNumber fullName expectedReleaseDate status')
      .limit(50)
      .lean();
  }

  private async nextSeq(key: string): Promise<number> {
    const doc = await this.counters.findOneAndUpdate(
      { _id: key } as any,
      { $inc: { seq: 1 } },
      { new: true, upsert: true },
    );
    return doc.seq;
  }

  private checkDates(admission?: string, release?: string) {
    if (admission && release && new Date(release) <= new Date(admission)) {
      throw new UnprocessableEntityException('Expected release date must be after the admission date');
    }
  }
}
