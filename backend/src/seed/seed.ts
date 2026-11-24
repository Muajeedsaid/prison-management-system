/**
 * Demo data for development. Run once with:  npm run seed
 * Creates one account for every role, a few cells, and a few FICTIONAL inmates.
 * Safe to run again: anything that already exists is skipped.
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { CasesService } from '../cases/cases.service';
import { CellsService } from '../cells/cells.service';
import { Role } from '../common/roles';
import { Gender, InmateStatus } from '../inmates/inmate.schema';
import { InmatesService } from '../inmates/inmates.service';
import { UsersService } from '../users/users.service';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  const users = app.get(UsersService);
  const cells = app.get(CellsService);
  const inmates = app.get(InmatesService);
  const cases = app.get(CasesService);

  const password = process.env.SEED_PASSWORD ?? 'ChangeMe123!';
  const accounts: [string, string, Role][] = [
    ['System Admin', 'admin@pms.local', Role.ADMIN],
    ['Facility Controller', 'controller@pms.local', Role.CONTROLLER],
    ['Records Officer', 'records@pms.local', Role.RECORDS],
    ['Cell Officer', 'cell@pms.local', Role.CELL],
    ['Medical Officer', 'medical@pms.local', Role.MEDICAL],
    ['Court Liaison', 'court@pms.local', Role.COURT],
    ['Visitor Desk Officer', 'visitor@pms.local', Role.VISITOR_DESK],
  ];

  const created: Record<string, string> = {};
  for (const [fullName, email, role] of accounts) {
    const existing = await users.findByEmailWithSecrets(email);
    if (existing) {
      created[email] = existing.id;
      continue;
    }
    const user = await users.create({ fullName, email, password, role });
    created[email] = String(user._id);
    console.log(`created user ${email} (${role})`);
  }

  const existingCells = await cells.findAll();
  if (existingCells.length === 0) {
    for (const [block, name, capacity] of [
      ['A', 'A-01', 4],
      ['A', 'A-02', 4],
      ['B', 'B-01', 6],
      ['B', 'B-02', 6],
    ] as const) {
      await cells.create({ block, name, capacity });
    }
    console.log('created 4 cells');
  }

  const { meta } = await inmates.findAll({ page: 1, limit: 1 } as any);
  if (meta.total === 0) {
    const records = created['records@pms.local'];
    const day = 86_400_000;
    const iso = (offsetDays: number) => new Date(Date.now() + offsetDays * day).toISOString().slice(0, 10);
    const sample = [
      { fullName: 'Sample Inmate One', gender: Gender.MALE, dateOfBirth: '1988-03-14', status: InmateStatus.AWAITING_TRIAL },
      {
        fullName: 'Sample Inmate Two',
        gender: Gender.MALE,
        dateOfBirth: '1992-09-02',
        status: InmateStatus.CONVICTED,
        sentenceMonths: 12,
        expectedReleaseDate: iso(20),
      },
      { fullName: 'Sample Inmate Three', gender: Gender.FEMALE, dateOfBirth: '1995-12-21', status: InmateStatus.AWAITING_TRIAL },
    ];
    const allCells = await cells.findAll();
    for (let i = 0; i < sample.length; i++) {
      const inmate = await inmates.create(
        {
          ...sample[i],
          admissionDate: iso(-30 - i * 10),
          nextOfKin: { name: 'Sample Relative', phone: '08000000000', relationship: 'Sibling' },
        },
        records,
      );
      await inmates.setCell(String(inmate._id), String(allCells[i % allCells.length]._id));
      if (sample[i].status === InmateStatus.AWAITING_TRIAL) {
        await cases.create(
          String(inmate._id),
          { caseNumber: `DEMO/${i + 1}/2026`, charges: ['Demo charge'], court: 'Demo High Court', nextCourtDate: iso(7 + i) },
          records,
        );
      }
    }
    console.log('created 3 fictional inmates with cells and cases');
  }

  console.log('\nSeed finished. Log in with any account above using the password from SEED_PASSWORD.');
  console.log('Change these passwords before using the system for anything real.');
  await app.close();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
