import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { buildMeta, escapeRegex, PaginationQuery } from '../common/pagination';
import { AuditLog, AuditLogDocument } from './audit-log.schema';

const SENSITIVE_KEYS = ['password', 'newPassword', 'refreshToken', 'accessToken', 'token'];

/** Remove secrets before anything is written to the audit log. */
export function sanitize(body: unknown): Record<string, unknown> | undefined {
  if (!body || typeof body !== 'object') return undefined;
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
    clean[key] = SENSITIVE_KEYS.includes(key) ? '[hidden]' : value;
  }
  return clean;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(@InjectModel(AuditLog.name) private model: Model<AuditLogDocument>) {}

  async record(entry: Partial<AuditLog>) {
    try {
      await this.model.create(entry);
    } catch (err) {
      // Never let a logging failure break the user's request.
      this.logger.error(`Could not write audit entry: ${(err as Error).message}`);
    }
  }

  async list(query: PaginationQuery & { user?: string; method?: string }) {
    const filter: Record<string, unknown> = {};
    if (query.user) filter.userEmail = new RegExp(escapeRegex(query.user), 'i');
    if (query.method) filter.method = query.method.toUpperCase();
    const [data, total] = await Promise.all([
      this.model
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean(),
      this.model.countDocuments(filter),
    ]);
    return { data, meta: buildMeta(query.page, query.limit, total) };
  }
}
