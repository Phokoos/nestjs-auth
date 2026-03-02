import { ConsoleLogger, LoggerService, LogLevel } from '@nestjs/common';
import { join, dirname } from 'path';
import { appendFileSync, existsSync } from 'node:fs';
import { mkdirSync } from 'fs';
import { isDev } from '../../utils/is-dev';
import { ConfigService } from '@nestjs/config';

export class LoggerServiceCommon implements LoggerService {
  private readonly logFile: string = join(process.cwd(), 'logs/app.log');
  private readonly consoleLogger = new ConsoleLogger();
  private readonly isDev: boolean;

  constructor(private readonly configService: ConfigService) {
    this.isDev = isDev(configService);
  }

  log(message: any, context: string) {
    this.writeToFile('log', message, context);
    if (this.isDev) this.consoleLogger.log(message, context);
  }

  error(message: any, trace: string, context: string) {
    const isError = message instanceof Error;
    const errorMessage: string = isError ? message.message : String(message);
    const errorTrace: string | undefined = isError ? message.stack : trace;

    this.writeToFile('error', errorMessage, context, errorTrace);
    if (this.isDev) this.consoleLogger.error(errorMessage, errorTrace, context);
  }

  warn(message: any, context: string) {
    this.writeToFile('warn', message, context);
    if (this.isDev) this.consoleLogger.warn(message, context);
  }

  private writeToFile(
    level: LogLevel,
    message: any,
    context?: string,
    trace?: string,
  ) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}]${context ? ` [${context}]` : ''}: ${message}${trace ? `\nTRACE: ${trace}` : ''}\n`;

    const logDir = dirname(this.logFile);

    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true });
    }

    appendFileSync(this.logFile, logMessage);
  }
}
