import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser, Roles } from '../common/decorators';
import { ParseObjectIdPipe } from '../common/parse-object-id.pipe';
import { INMATE_READERS, Role } from '../common/roles';
import { CreateInmateDto, ListInmatesQuery, UpdateInmateDto } from './inmates.dto';
import { InmatesService } from './inmates.service';

@ApiTags('Inmates')
@ApiBearerAuth()
@Controller('inmates')
export class InmatesController {
  constructor(private service: InmatesService) {}

  @Get()
  @Roles(...INMATE_READERS)
  @ApiOperation({ summary: 'List inmates with search, filter, sort and paging' })
  findAll(@Query() query: ListInmatesQuery) {
    return this.service.findAll(query);
  }

  @Post()
  @Roles(Role.RECORDS)
  @ApiOperation({ summary: 'Register a new inmate (Records Officer)' })
  create(@Body() dto: CreateInmateDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user.id);
  }

  @Get(':id')
  @Roles(...INMATE_READERS)
  @ApiOperation({ summary: 'Get one inmate' })
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.RECORDS)
  @ApiOperation({ summary: 'Update part of an inmate record (Records Officer)' })
  update(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateInmateDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.CONTROLLER)
  @HttpCode(204)
  @ApiOperation({ summary: 'Archive an inmate (soft delete, Facility Controller)' })
  async archive(@Param('id', ParseObjectIdPipe) id: string) {
    await this.service.archive(id);
  }
}
