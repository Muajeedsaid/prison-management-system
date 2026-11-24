import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { Model } from 'mongoose';
import { buildMeta, PaginationQuery } from '../common/pagination';
import { User, UserDocument } from './user.schema';
import { CreateUserDto, UpdateUserDto } from './users.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private model: Model<UserDocument>) {}

  async create(dto: CreateUserDto) {
    const exists = await this.model.exists({ email: dto.email.toLowerCase() });
    if (exists) throw new ConflictException('A user with this email already exists');
    const password = await bcrypt.hash(dto.password, 10);
    const user = await this.model.create({ ...dto, password });
    return this.findOne(user.id);
  }

  async findAll(query: PaginationQuery) {
    const [data, total] = await Promise.all([
      this.model
        .find()
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean(),
      this.model.countDocuments(),
    ]);
    return { data, meta: buildMeta(query.page, query.limit, total) };
  }

  async findOne(id: string) {
    const user = await this.model.findById(id).lean();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    const patch: Record<string, unknown> = { ...dto };
    if (dto.password) patch.password = await bcrypt.hash(dto.password, 10);
    // Changing the password or deactivating the account also signs the user out everywhere.
    if (dto.password || dto.isActive === false) patch.refreshTokenHash = null;
    const user = await this.model.findByIdAndUpdate(id, patch, { new: true }).lean();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /** Used by auth: loads the password hash, which is hidden everywhere else. */
  findByEmailWithSecrets(email: string) {
    return this.model.findOne({ email: email.toLowerCase() }).select('+password +refreshTokenHash');
  }

  findByIdWithRefresh(id: string) {
    return this.model.findById(id).select('+refreshTokenHash');
  }

  setRefreshHash(id: string, hash: string | null) {
    return this.model.updateOne({ _id: id }, { refreshTokenHash: hash });
  }
}
