import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterRequest {
  @ApiProperty({
    description: 'Name of the user',
    example: 'John',
    required: true,
  })
  @IsNotEmpty({
    message: 'Name is required',
  })
  @IsString({
    message: 'Name must be a string',
  })
  name: string;

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
  @IsString({
    message: 'Password must be a string',
  })
  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message: 'Password must be strong. Minimum 8 characters',
    },
  )
  password: string;
}
