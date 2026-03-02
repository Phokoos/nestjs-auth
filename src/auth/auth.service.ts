import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterRequest } from './dto/register.dto';
import { hash, verify } from 'argon2';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interfaces/jwt.interface';
import ms, { StringValue } from 'ms';
import { LoginRequest } from './dto/login.dto';
import { Response, Request } from 'express';
import { isDev } from '../utils/is-dev';
import { AuthResponse } from './dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly JWT_ACCESS_TOKEN_TTL: StringValue;
  private readonly JWT_REFRESH_TOKEN_TTL: StringValue;
  private readonly JWT_REFRESH_SECRET: string;
  private readonly COOKIE_DOMAIN: string;
  private readonly IS_DEV: boolean;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.COOKIE_DOMAIN = configService.getOrThrow<string>('COOKIE_DOMAIN');
    this.JWT_ACCESS_TOKEN_TTL = configService.getOrThrow<StringValue>(
      'JWT_ACCESS_TOKEN_TTL',
    );
    this.JWT_REFRESH_TOKEN_TTL = configService.getOrThrow<StringValue>(
      'JWT_REFRESH_TOKEN_TTL',
    );
    this.JWT_REFRESH_SECRET =
      configService.getOrThrow<string>('JWT_REFRESH_SECRET');
    this.IS_DEV = isDev(this.configService);
  }

  async register(res: Response, dto: RegisterRequest): Promise<AuthResponse> {
    const { name, email, password } = dto;
    const existingUser = await this.prismaService.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const user = await this.prismaService.user.create({
      data: {
        name,
        email,
        password: await hash(password),
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return this.auth(res, user);
  }

  async login(res: Response, dto: LoginRequest): Promise<AuthResponse> {
    const { email, password } = dto;

    const user = await this.prismaService.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValidPassword: boolean = await verify(user.password, password);

    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prismaService.refreshToken.deleteMany({
      where: { userId: user.id },
    });

    return this.auth(res, {
      id: user.id,
      name: user.name,
      email: user.email,
    });
  }

  async refresh(req: Request, res: Response): Promise<AuthResponse> {
    const refreshToken = req.cookies['refreshToken'] as string;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const { count } = await this.prismaService.refreshToken.deleteMany({
      where: { token: refreshToken },
    });

    if (count === 0) {
      throw new UnauthorizedException('Invalid credentials');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.prismaService.user.findUnique({
      where: { id: payload.id },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.auth(res, user);
  }

  public async logout(req: Request, res: Response): Promise<object> {
    const refreshToken = req.cookies['refreshToken'] as string;

    if (refreshToken) {
      await this.prismaService.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      domain: this.COOKIE_DOMAIN,
      secure: !this.IS_DEV,
      sameSite: this.IS_DEV ? 'lax' : 'none',
    });

    return {
      status: 'success',
      message: 'Logged out successfully',
    };
  }

  private async auth(res: Response, user: JwtPayload): Promise<AuthResponse> {
    const { accessToken, refreshToken } = this.generateToken(
      user.id,
      user.name,
      user.email,
    );

    const expiresAt = new Date(Date.now() + ms(this.JWT_REFRESH_TOKEN_TTL));

    await this.prismaService.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    this.setCookie(res, refreshToken, expiresAt);

    return {
      accessToken,
    };
  }

  public async validate(payload: JwtPayload): Promise<JwtPayload> {
    const user = await this.prismaService.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  private generateToken(
    id: string,
    name: string,
    email: string,
  ): { accessToken: string; refreshToken: string } {
    const payload: JwtPayload = { id, name, email };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.JWT_ACCESS_TOKEN_TTL,
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.JWT_REFRESH_TOKEN_TTL,
      secret: this.JWT_REFRESH_SECRET,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private setCookie(res: Response, value: string, expires: Date) {
    res.cookie('refreshToken', value, {
      httpOnly: true,
      domain: this.COOKIE_DOMAIN,
      expires,
      secure: !this.IS_DEV,
      sameSite: this.IS_DEV ? 'lax' : 'none',
    });
  }
}
