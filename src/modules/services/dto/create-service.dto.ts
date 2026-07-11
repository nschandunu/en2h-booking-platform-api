import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateServiceDto {
  @ApiProperty({
    example: 'Haircut',
    description: 'Unique title of the service',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : value,
  )
  title: string;

  @ApiProperty({
    example: 'A professional haircut',
    description: 'Detailed description',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description: string;

  @ApiProperty({
    example: 45,
    description: 'Duration in minutes (must be > 0)',
  })
  @IsNumber()
  @Min(1)
  duration: number;

  @ApiProperty({
    example: 25.5,
    description: 'Price of the service (must be > 0)',
  })
  @IsNumber()
  @Min(0.01)
  price: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the service is active and bookable',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
