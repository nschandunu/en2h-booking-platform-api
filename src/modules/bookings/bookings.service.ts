import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma, Booking, BookingStatus } from '@prisma/client';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { QueryBookingDto } from './dto/query-booking.dto';
import { BookingStatusValidator } from './helpers/booking-status.validator';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createBookingDto: CreateBookingDto): Promise<Booking> {
    // 1. Verify date is >= today
    const bookingDateObj = new Date(createBookingDto.bookingDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (bookingDateObj < today) {
      throw new BadRequestException('Booking date cannot be in the past.');
    }

    // 2. Check if service exists
    const service = await this.prisma.service.findUnique({
      where: { id: createBookingDto.serviceId },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${createBookingDto.serviceId} not found.`);
    }

    // 3. Check if service is active
    if (!service.isActive) {
      throw new BadRequestException('Cannot book an inactive service.');
    }

    // 4. Create booking, letting Prisma catch duplicate (same service, date, time)
    try {
      return await this.prisma.booking.create({
        data: createBookingDto,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('This time slot is already booked for this service.');
        }
      }
      throw error;
    }
  }

  async findAll(query: QueryBookingDto) {
    const { page = 1, limit = 10, status, customerName, serviceId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.BookingWhereInput = {};
    if (status) {
      where.status = status;
    }
    if (serviceId) {
      where.serviceId = serviceId;
    }
    if (customerName) {
      where.customerName = { contains: customerName, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { service: { select: { title: true } } },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Booking> {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { service: true },
    });
    
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found.`);
    }
    
    return booking;
  }

  async updateStatus(id: string, updateDto: UpdateBookingStatusDto): Promise<Booking> {
    const booking = await this.findOne(id);

    if (!BookingStatusValidator.canTransition(booking.status, updateDto.status)) {
      throw new BadRequestException(`Cannot transition booking from ${booking.status} to ${updateDto.status}`);
    }

    return this.prisma.booking.update({
      where: { id },
      data: { status: updateDto.status },
    });
  }

  async cancel(id: string): Promise<Booking> {
    const booking = await this.findOne(id);

    if (!BookingStatusValidator.canTransition(booking.status, BookingStatus.CANCELLED)) {
      throw new BadRequestException(`Cannot cancel booking with status ${booking.status}`);
    }

    return this.prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.CANCELLED },
    });
  }
}
