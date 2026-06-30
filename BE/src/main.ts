import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';

import { AppModule } from './app.module';
import { ServiceErrorsFilter } from './commons/filters/service.error.filter';
import { Connection } from 'typeorm';
import * as fs from 'fs';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Load and apply SQL permissions file
  try {
    const connection = app.get(Connection);
    const sqlPath = join(__dirname, 'sql/permissions.sql');
    if (fs.existsSync(sqlPath)) {
      const sqlQueries = fs.readFileSync(sqlPath).toString();
      await connection.query(sqlQueries);
      Logger.log('==== Seeded permissions successfully from permissions.sql ====');
    } else {
      Logger.warn(`==== permissions.sql not found at ${sqlPath} ====`);
    }
  } catch (err) {
    Logger.error('==== Failed to seed permissions on start ====', err);
  }

  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: '*',
    methods: ['GET', 'PUT', 'POST', 'PATCH', 'DELETE'],
  });
  const config = new DocumentBuilder()
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
      },
      'JWT-auth',
    )
    .setTitle('VNA - Meritorious Person - API documentation')
    .setDescription('')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/api-docs', app, document);

  app.use(json({ limit: '50mb' }));
  app.use(
    urlencoded({
      extended: true,
      limit: '50mb',
    }),
  );

  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new ServiceErrorsFilter());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  const port = process.env.VNA_PORT || 3000;
  Logger.log(`==== ${port} ====`);
  await app.listen(port, () =>
    Logger.log(`==== BE listening on port ${port} ====`),
  );
}
bootstrap();
