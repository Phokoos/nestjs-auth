import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginRequest {
  @ApiProperty({
    description: 'Email of the user',
    example: 'email@example.com',
    required: true,
  })
  @IsNotEmpty({
    message: 'Email is required',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsString({
    message: 'Email must be a string',
  })
  email: string;

  @ApiProperty({
    description: 'Password of the user',
    example: '!Password123',
    required: true,
    minLength: 8,
  })
  @IsNotEmpty({
    message: 'Password is required',
  })
  @MinLength(8)
  password: string;
}
