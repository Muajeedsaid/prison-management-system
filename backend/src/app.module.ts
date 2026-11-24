import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuditInterceptor } from './audit/audit.interceptor';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { CasesModule } from './cases/cases.module';
import { CellsModule } from './cells/cells.module';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
import { JwtAuthGuard, RolesGuard } from './common/guards';
import { IncidentsModule } from './incidents/incidents.module';
import { InmatesModule } from './inmates/inmates.module';
import { MedicalModule } from './medical/medical.module';
import { ReleasesModule } from './releases/releases.module';
import { ReportsModule } from './reports/reports.module';
import { UsersModule } from './users/users.module';
import { VisitsModule } from './visits/visits.module';

/** Fail fast at start-up if a required setting is missing, instead of failing later at login. */
function validateEnv(env: Record<string, unknown>) {
  const required = ['MONGODB_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
  const missing = required.filter((key) => !env[key]);
  if (missing.length) throw new Error(`Missing environment variables: ${missing.join(', ')}. Copy .env.example to .env`);
  return env;
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({ uri: config.getOrThrow<string>('MONGODB_URI') }),
    }),
    // Default limit for every route: 100 requests per minute per IP. Login has a stricter limit.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    AuditModule,
    AuthModule,
    UsersModule,
    InmatesModule,
    CasesModule,
    CellsModule,
    VisitsModule,
    MedicalModule,
    IncidentsModule,
    ReleasesModule,
    ReportsModule,
  ],
  providers: [
    // Guards run in this order: rate limit -> who are you (JWT) -> are you allowed (role)
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
