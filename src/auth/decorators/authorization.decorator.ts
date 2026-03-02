import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

export function Authorization() {
  return applyDecorators(UseGuards(JwtAuthGuard), ApiBearerAuth());
}
