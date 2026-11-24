import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  const origins = (process.env.CORS_ORIGINS ?? 'http://localhost:3000').split(',').map((o) => o.trim());
  app.enableCors({ origin: origins, credentials: true });

  // Every route starts with /api/v1 so future versions can live beside it.
  app.setGlobalPrefix('api/v1');

  // Validate every request body and query against its DTO class.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip unknown fields
      forbidNonWhitelisted: true, // ...and reject the request that sent them
      transform: true, // turn plain JSON into DTO instances (also converts "2" to 2 for numbers)
    }),
  );

  // Interactive API documentation generated from the code: http://localhost:4000/api/docs
  const swagger = new DocumentBuilder()
    .setTitle('Prison Management Information System API')
    .setDescription('REST API for inmate records and correctional facility administration')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swagger), {
    swaggerOptions: { persistAuthorization: true },
  });

  app.enableShutdownHooks();
  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  new Logger('Bootstrap').log(`API running on http://localhost:${port}/api/v1  (docs: /api/docs)`);
}

bootstrap();
