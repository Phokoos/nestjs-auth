import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { JwtPayload } from '../interfaces/jwt.interface';

export const Authorized = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();

    const user = request.user as JwtPayload;

    return data ? user?.[data] : user;
  },
);
