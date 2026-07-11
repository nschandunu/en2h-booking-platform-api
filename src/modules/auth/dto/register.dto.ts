import {
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'John Doe', description: 'Full name of the user' })
  @IsString()
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'Unique email address',
  })
  @IsEmail()
  @Transform(({ value }) => value?.trim().toLowerCase())
  email: string;

  @ApiProperty({
    example: 'StrongPass1!',
    description:
      'Password must contain at least 1 uppercase, 1 lowercase, 1 number, and be at least 8 characters long.',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  @Matches(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/, {
    message:
      'Password must contain at least 1 uppercase, 1 lowercase, and 1 number',
  })
  password: string;
}
