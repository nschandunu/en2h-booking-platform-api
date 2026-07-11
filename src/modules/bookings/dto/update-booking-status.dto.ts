import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus } from '@prisma/client';

export class UpdateBookingStatusDto {
  @ApiProperty({ enum: BookingStatus, description: 'The new status to transition to' })
  @IsEnum(BookingStatus)
  @IsNotEmpty()
  status: BookingStatus;
}
