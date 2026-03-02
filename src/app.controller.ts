import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { Public } from './auth/decorators/public.decorator';
import { SkipThrottle } from '@nestjs/throttler';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @SkipThrottle()
  @Public()
  @ApiOperation({
    summary: 'Health check endpoint',
  })
  @ApiOkResponse({
    schema: {
      example: {
        status: 'ok',
      },
    },
  })
  @Get('/health')
  healthCheck() {
    return { status: 'ok' };
  }
}
