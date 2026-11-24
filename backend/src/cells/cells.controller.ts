import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser, Roles } from '../common/decorators';
import { ParseObjectIdPipe } from '../common/parse-object-id.pipe';
import { Role } from '../common/roles';
import { CreateCellDto, TransferDto, UpdateCellDto } from './cells.dto';
import { CellsService } from './cells.service';

@ApiTags('Cells')
@ApiBearerAuth()
@Controller()
export class CellsController {
  constructor(private service: CellsService) {}

  @Get('cells')
  @Roles(Role.CONTROLLER, Role.CELL)
  @ApiOperation({ summary: 'List cells with live occupancy' })
  findAll() {
    return this.service.findAll();
  }

  @Post('cells')
  @Roles(Role.CONTROLLER)
  @ApiOperation({ summary: 'Create a cell (Facility Controller)' })
  create(@Body() dto: CreateCellDto) {
    return this.service.create(dto);
  }

  @Get('cells/:id')
  @Roles(Role.CONTROLLER, Role.CELL)
  @ApiOperation({ summary: 'One cell with the inmates inside it' })
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch('cells/:id')
  @Roles(Role.CONTROLLER)
  @ApiOperation({ summary: 'Change capacity or take a cell out of use' })
  update(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateCellDto) {
    return this.service.update(id, dto);
  }

  @Post('inmates/:id/transfers')
  @Roles(Role.CELL)
  @ApiOperation({ summary: 'Move an inmate to a cell (first allocation or transfer)' })
  transfer(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: TransferDto, @CurrentUser() user: AuthUser) {
    return this.service.transfer(id, dto, user.id);
  }

  @Get('inmates/:id/transfers')
  @Roles(Role.CELL, Role.CONTROLLER)
  @ApiOperation({ summary: 'Cell movement history of an inmate' })
  history(@Param('id', ParseObjectIdPipe) id: string) {
    return this.service.history(id);
  }
}
