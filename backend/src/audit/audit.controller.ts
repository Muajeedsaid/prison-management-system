import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { Roles } from '../common/decorators';
import { PaginationQuery } from '../common/pagination';
import { Role } from '../common/roles';
import { AuditService } from './audit.service';

export class AuditQuery extends PaginationQuery {
  @ApiPropertyOptional({ description: 'Filter by user email (partial match)' })
  @IsOptional()
  @IsString()
  user?: string;

  @ApiPropertyOptional({ example: 'POST' })
  @IsOptional()
  @IsString()
  method?: string;
}

@ApiTags('Audit')
@ApiBearerAuth()
@Controller('audit-logs')
@Roles(Role.ADMIN)
export class AuditController {
  constructor(private service: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Read the audit trail (System Admin only, read-only)' })
  list(@Query() query: AuditQuery) {
    return this.service.list(query);
  }
}
