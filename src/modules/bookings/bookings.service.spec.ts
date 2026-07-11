import { Test, TestingModule } from '@nestjs/testing';
import { BookingsService } from './bookings.service';
import { PrismaService } from '@database/prisma.service';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, Prisma } from '@prisma/client';

describe('BookingsService', () => {
  let service: BookingsService;

  const mockPrismaService = {
    service: {
      findUnique: jest.fn(),
    },
    booking: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should throw BadRequestException if booking date is in the past', async () => {
      // Arrange
      const dto = {
        serviceId: '1',
        customerName: 'Test',
        customerEmail: 'test@test.com',
        customerPhone: '123',
        bookingDate: '2020-01-01', // Past date
        bookingTime: '10:00',
      };

      // Act & Assert
      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      await expect(service.create(dto)).rejects.toThrow(
        'Booking date cannot be in the past.',
      );
    });

    it('should throw NotFoundException if service does not exist', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const dto = {
        serviceId: '1',
        customerName: 'Test',
        customerEmail: 'test@test.com',
        customerPhone: '123',
        bookingDate: futureDate.toISOString().split('T')[0],
        bookingTime: '10:00',
      };

      mockPrismaService.service.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if service is inactive', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const dto = {
        serviceId: '1',
        customerName: 'Test',
        customerEmail: 'test@test.com',
        customerPhone: '123',
        bookingDate: futureDate.toISOString().split('T')[0],
        bookingTime: '10:00',
      };

      mockPrismaService.service.findUnique.mockResolvedValue({
        id: '1',
        isActive: false,
      });

      // Act & Assert
      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      await expect(service.create(dto)).rejects.toThrow(
        'Cannot book an inactive service.',
      );
    });

    it('should throw ConflictException on duplicate booking (same service, date, time)', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const dto = {
        serviceId: '1',
        customerName: 'Test',
        customerEmail: 'test@test.com',
        customerPhone: '123',
        bookingDate: futureDate.toISOString().split('T')[0],
        bookingTime: '10:00',
      };

      mockPrismaService.service.findUnique.mockResolvedValue({
        id: '1',
        isActive: true,
      });
      mockPrismaService.booking.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: '7.8.0',
        }),
      );

      // Act & Assert
      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });

    it('should successfully create a booking', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const dto = {
        serviceId: '1',
        customerName: 'Test',
        customerEmail: 'test@test.com',
        customerPhone: '123',
        bookingDate: futureDate.toISOString().split('T')[0],
        bookingTime: '10:00',
      };

      mockPrismaService.service.findUnique.mockResolvedValue({
        id: '1',
        isActive: true,
      });
      mockPrismaService.booking.create.mockResolvedValue({
        id: 'booking-id',
        ...dto,
      });

      // Act
      const result = await service.create(dto);

      // Assert
      expect(mockPrismaService.booking.create).toHaveBeenCalledWith({
        data: dto,
      });
      expect(result.id).toEqual('booking-id');
    });
  });

  describe('findAll', () => {
    it('should return paginated and filtered bookings', async () => {
      // Arrange
      const query = {
        page: 1,
        limit: 10,
        status: BookingStatus.PENDING,
        customerName: 'Test',
      };
      const expectedWhere = {
        status: BookingStatus.PENDING,
        customerName: { contains: 'Test', mode: 'insensitive' },
      };

      mockPrismaService.booking.findMany.mockResolvedValue([{ id: '1' }]);
      mockPrismaService.booking.count.mockResolvedValue(1);

      // Act
      const result = await service.findAll(query);

      // Assert
      expect(mockPrismaService.booking.findMany).toHaveBeenCalledWith({
        where: expectedWhere,
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { service: { select: { title: true } } },
      });
      expect(result.data.length).toBe(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return a booking by id', async () => {
      // Arrange
      mockPrismaService.booking.findUnique.mockResolvedValue({ id: '1' });

      // Act
      const result = await service.findOne('1');

      // Assert
      expect(mockPrismaService.booking.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: { service: true },
      });
      expect(result.id).toBe('1');
    });

    it('should throw NotFoundException if booking is not found', async () => {
      // Arrange
      mockPrismaService.booking.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should update status on valid transition (PENDING -> CONFIRMED)', async () => {
      // Arrange
      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: '1',
        status: BookingStatus.PENDING,
      });
      mockPrismaService.booking.update.mockResolvedValue({
        id: '1',
        status: BookingStatus.CONFIRMED,
      });

      // Act
      const result = await service.updateStatus('1', {
        status: BookingStatus.CONFIRMED,
      });

      // Assert
      expect(mockPrismaService.booking.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { status: BookingStatus.CONFIRMED },
      });
      expect(result.status).toEqual(BookingStatus.CONFIRMED);
    });

    it('should throw BadRequestException on invalid transition (COMPLETED -> PENDING)', async () => {
      // Arrange
      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: '1',
        status: BookingStatus.COMPLETED,
      });

      // Act & Assert
      await expect(
        service.updateStatus('1', { status: BookingStatus.PENDING }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancel', () => {
    it('should cancel a valid booking (PENDING -> CANCELLED)', async () => {
      // Arrange
      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: '1',
        status: BookingStatus.PENDING,
      });
      mockPrismaService.booking.update.mockResolvedValue({
        id: '1',
        status: BookingStatus.CANCELLED,
      });

      // Act
      const result = await service.cancel('1');

      // Assert
      expect(mockPrismaService.booking.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { status: BookingStatus.CANCELLED },
      });
      expect(result.status).toEqual(BookingStatus.CANCELLED);
    });

    it('should throw BadRequestException when cancelling a COMPLETED booking', async () => {
      // Arrange
      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: '1',
        status: BookingStatus.COMPLETED,
      });

      // Act & Assert
      await expect(service.cancel('1')).rejects.toThrow(BadRequestException);
    });
  });
});
