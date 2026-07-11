import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { QueryBookingDto } from './dto/query-booking.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new booking (Public)' })
  @ApiResponse({ status: 201, description: 'Booking successfully created.' })
  @ApiResponse({ status: 400, description: 'Validation errors (e.g. past date, inactive service).' })
  @ApiResponse({ status: 404, description: 'Service not found.' })
  @ApiResponse({ status: 409, description: 'Double booking detected for this service at this time.' })
  create(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingsService.create(createBookingDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retrieve a paginated list of bookings (Protected)' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of bookings.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  findAll(@Query() queryBookingDto: QueryBookingDto) {
    return this.bookingsService.findAll(queryBookingDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retrieve a specific booking by ID (Protected)' })
  @ApiParam({ name: 'id', description: 'UUID of the booking' })
  @ApiResponse({ status: 200, description: 'Booking found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Booking not found.' })
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update the status of a booking (Protected)' })
  @ApiParam({ name: 'id', description: 'UUID of the booking' })
  @ApiResponse({ status: 200, description: 'Booking status successfully updated.' })
  @ApiResponse({ status: 400, description: 'Invalid state transition.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Booking not found.' })
  updateStatus(@Param('id') id: string, @Body() updateDto: UpdateBookingStatusDto) {
    return this.bookingsService.updateStatus(id, updateDto);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel a booking explicitly (Protected)' })
  @ApiParam({ name: 'id', description: 'UUID of the booking' })
  @ApiResponse({ status: 200, description: 'Booking successfully cancelled.' })
  @ApiResponse({ status: 400, description: 'Invalid state transition (e.g. already completed).' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Booking not found.' })
  cancel(@Param('id') id: string) {
    return this.bookingsService.cancel(id);
  }
}
