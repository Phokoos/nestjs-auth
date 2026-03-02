import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { setupSwagger } from './utils/swagger.util';
import { ConfigService } from '@nestjs/config';
import { LoggerServiceCommon } from './common/logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  const config = app.get(ConfigService);

  app.use(helmet());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: config.getOrThrow<string>('CLIENT_URLS').split(','),
    credentials: true,
  });

  app.use(cookieParser());

  app.useLogger(new LoggerServiceCommon(config));

  app.setGlobalPrefix('api');

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  setupSwagger(app);

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
