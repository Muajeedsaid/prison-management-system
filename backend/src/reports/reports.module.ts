import { Controller, Get, Injectable, Module } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators';
import { Role } from '../common/roles';
import { CasesModule } from '../cases/cases.module';
import { CasesService } from '../cases/cases.service';
import { CellsModule } from '../cells/cells.module';
import { CellsService } from '../cells/cells.service';
import { InmatesModule } from '../inmates/inmates.module';
import { InmatesService } from '../inmates/inmates.service';

@Injectable()
export class ReportsService {
  constructor(
    private inmates: InmatesService,
    private cells: CellsService,
    private cases: CasesService,
  ) {}

  async occupancy() {
    const cells = await this.cells.findAll();
    const active = cells.filter((c) => c.isActive);
    const totalCapacity = active.reduce((sum, c) => sum + c.capacity, 0);
    const occupied = cells.reduce((sum, c) => sum + c.occupied, 0);
    return {
      totalCapacity,
      occupied,
      available: Math.max(0, totalCapacity - occupied),
      occupancyRate: totalCapacity === 0 ? 0 : Math.round((occupied / totalCapacity) * 1000) / 10,
      cells: cells.map((c) => ({
        id: c._id,
        block: c.block,
        name: c.name,
        capacity: c.capacity,
        occupied: c.occupied,
        isActive: c.isActive,
      })),
    };
  }

  async summary() {
    const [byStatus, admissions, upcomingReleases, upcomingCourtDates, occupancy] = await Promise.all([
      this.inmates.countByStatus(),
      this.inmates.admissionsByMonth(6),
      this.inmates.upcomingReleases(30),
      this.cases.upcoming(14),
      this.occupancy(),
    ]);
    const totalInmates = Object.values(byStatus).reduce((a, b) => a + b, 0);
    return {
      totalInmates,
      inCustody: totalInmates - (byStatus['released'] ?? 0) - (byStatus['transferred-out'] ?? 0),
      byStatus,
      admissionsByMonth: admissions,
      occupancy: {
        totalCapacity: occupancy.totalCapacity,
        occupied: occupancy.occupied,
        occupancyRate: occupancy.occupancyRate,
      },
      upcomingReleases,
      upcomingCourtDates,
    };
  }
}

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
@Roles(Role.CONTROLLER)
export class ReportsController {
  constructor(private service: ReportsService) {}

  @Get('occupancy')
  @ApiOperation({ summary: 'Capacity, occupancy and occupancy rate per cell' })
  occupancy() {
    return this.service.occupancy();
  }

  @Get('summary')
  @ApiOperation({ summary: 'Dashboard numbers: counts, admissions, upcoming releases and court dates' })
  summary() {
    return this.service.summary();
  }
}

@Module({
  imports: [InmatesModule, CellsModule, CasesModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
