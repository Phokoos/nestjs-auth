import { ConfigService } from '@nestjs/config';

export const isDev = (configureServer: ConfigService): boolean =>
  configureServer.getOrThrow('NODE_ENV') === 'development';
