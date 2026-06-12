import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';

import { AppModule } from './app.module';
import { ServiceErrorsFilter } from './commons/filters/service.error.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: '*',
    methods: ['GET', 'PUT', 'POST', 'PATCH', 'DELETE'],
  });
  const config = new DocumentBuilder()
    .addBearerAuth({ in: 'header', type: 'http', bearerFormat: 'JWT' })
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

  const port = process.env.VNA_PORT || 3000;
  Logger.log(`==== ${port} ====`);
  await app.listen(port, () =>
    Logger.log(`==== BE listening on port ${port} ====`),
  );
}
bootstrap();
