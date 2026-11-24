import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { AuthUser, CurrentUser, Roles } from '../common/decorators';
import { ParseObjectIdPipe } from '../common/parse-object-id.pipe';
import { Role } from '../common/roles';
import { CreateCaseDto, UpdateCaseDto } from './cases.dto';
import { CasesService } from './cases.service';

class UpcomingQuery {
  @ApiPropertyOptional({ default: 14 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(365) days: number = 14;
}

@ApiTags('Cases')
@ApiBearerAuth()
@Controller()
export class CasesController {
  constructor(private service: CasesService) {}

  @Get('inmates/:id/cases')
  @Roles(Role.CONTROLLER, Role.RECORDS, Role.COURT)
  @ApiOperation({ summary: 'List the cases of an inmate' })
  findByInmate(@Param('id', ParseObjectIdPipe) id: string) {
    return this.service.findByInmate(id);
  }

  @Post('inmates/:id/cases')
  @Roles(Role.RECORDS, Role.COURT)
  @ApiOperation({ summary: 'Open a new case for an inmate' })
  create(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: CreateCaseDto, @CurrentUser() user: AuthUser) {
    return this.service.create(id, dto, user.id);
  }

  // Declared before cases/:id so "upcoming" is not read as an id.
  @Get('cases/upcoming')
  @Roles(Role.CONTROLLER, Role.RECORDS, Role.COURT)
  @ApiOperation({ summary: 'Court dates coming up in the next N days' })
  upcoming(@Query() query: UpcomingQuery) {
    return this.service.upcoming(query.days);
  }

  @Get('cases/:id')
  @Roles(Role.CONTROLLER, Role.RECORDS, Role.COURT)
  @ApiOperation({ summary: 'Get one case' })
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch('cases/:id')
  @Roles(Role.COURT)
  @ApiOperation({ summary: 'Update court date, bail, judgment or status (Court Liaison)' })
  update(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateCaseDto) {
    return this.service.update(id, dto);
  }
}
