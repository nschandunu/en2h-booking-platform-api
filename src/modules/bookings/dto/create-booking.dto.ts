import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({ example: 'John Doe', description: 'Name of the customer' })
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @ApiProperty({ example: 'john.doe@example.com', description: 'Email of the customer' })
  @IsEmail()
  @IsNotEmpty()
  customerEmail: string;

  @ApiProperty({ example: '+1234567890', description: 'Phone number of the customer' })
  @IsString()
  @IsNotEmpty()
  customerPhone: string;

  @ApiProperty({ example: 'uuid-string', description: 'UUID of the requested service' })
  @IsUUID()
  @IsNotEmpty()
  serviceId: string;

  @ApiProperty({ example: '2026-07-20', description: 'Date of the booking (YYYY-MM-DD)' })
  @IsDateString({ strict: true })
  @IsNotEmpty()
  bookingDate: string;

  @ApiProperty({ example: '14:30', description: 'Time of the booking (HH:mm)' })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'bookingTime must be in HH:mm format' })
  @IsNotEmpty()
  bookingTime: string;

  @ApiPropertyOptional({ example: 'Please prepare the tools early.', description: 'Additional notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
