import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InmatesService } from '../inmates/inmates.service';
import { Cell, CellDocument, Transfer, TransferDocument } from './cell.schema';
import { CreateCellDto, TransferDto, UpdateCellDto } from './cells.dto';

@Injectable()
export class CellsService {
  constructor(
    @InjectModel(Cell.name) private cells: Model<CellDocument>,
    @InjectModel(Transfer.name) private transfers: Model<TransferDocument>,
    private inmates: InmatesService,
  ) {}

  create(dto: CreateCellDto) {
    return this.cells.create(dto);
  }

  /** All cells with how many inmates each one holds right now. */
  async findAll() {
    const [cells, occupancy] = await Promise.all([
      this.cells.find().sort({ block: 1, name: 1 }).lean(),
      this.inmates.occupancyByCell(),
    ]);
    return cells.map((c) => {
      const occupied = occupancy[String(c._id)] ?? 0;
      return { ...c, occupied, available: Math.max(0, c.capacity - occupied) };
    });
  }

  async findOne(id: string) {
    const cell = await this.cells.findById(id).lean();
    if (!cell) throw new NotFoundException('Cell not found');
    const occupants = await this.inmates.findByCell(id);
    return { ...cell, occupied: occupants.length, available: Math.max(0, cell.capacity - occupants.length), occupants };
  }

  async update(id: string, dto: UpdateCellDto) {
    const cell = await this.cells.findById(id);
    if (!cell) throw new NotFoundException('Cell not found');
    if (dto.capacity !== undefined) {
      const occupied = await this.inmates.countInCell(id);
      if (dto.capacity < occupied) {
        throw new ConflictException(`Cannot reduce capacity below the ${occupied} inmate(s) currently inside`);
      }
    }
    Object.assign(cell, dto);
    await cell.save();
    return this.findOne(id);
  }

  async transfer(inmateId: string, dto: TransferDto, userId: string) {
    const inmate = await this.inmates.getActive(inmateId);
    const toCell = await this.cells.findById(dto.toCellId);
    if (!toCell) throw new NotFoundException('Destination cell not found');
    if (!toCell.isActive) throw new ConflictException('Destination cell is not in use');
    if (inmate.cell && String(inmate.cell) === dto.toCellId) {
      throw new ConflictException('The inmate is already in this cell');
    }
    const occupied = await this.inmates.countInCell(dto.toCellId);
    if (occupied >= toCell.capacity) throw new ConflictException('The destination cell is full');

    const record = await this.transfers.create({
      inmate: inmate._id,
      fromCell: inmate.cell ?? null,
      toCell: toCell._id,
      reason: dto.reason,
      transferredBy: userId,
    });
    await this.inmates.setCell(inmateId, dto.toCellId);
    return record;
  }

  async history(inmateId: string) {
    await this.inmates.getRaw(inmateId);
    return this.transfers
      .find({ inmate: inmateId })
      .sort({ createdAt: -1 })
      .populate('fromCell toCell', 'block name')
      .populate('transferredBy', 'fullName')
      .lean();
  }
}
