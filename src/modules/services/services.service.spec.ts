import { Test, TestingModule } from '@nestjs/testing';
import { ServicesService } from './services.service';
import { PrismaService } from '@database/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('ServicesService', () => {
  let service: ServicesService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    service: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
    prismaService = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should successfully create a service (Create Service)', async () => {
      // Arrange
      const dto = { title: 'Test Service', description: 'Desc', duration: 30, price: 100 };
      mockPrismaService.service.findUnique.mockResolvedValue(null);
      mockPrismaService.service.create.mockResolvedValue({ id: '1', ...dto });

      // Act
      const result = await service.create(dto as any);

      // Assert
      expect(mockPrismaService.service.findUnique).toHaveBeenCalledWith({ where: { title: dto.title } });
      expect(mockPrismaService.service.create).toHaveBeenCalledWith({ data: dto });
      expect(result.id).toEqual('1');
    });

    it('should throw ConflictException if title exists (Duplicate Title)', async () => {
      // Arrange
      const dto = { title: 'Test Service', description: 'Desc', duration: 30, price: 100 };
      mockPrismaService.service.findUnique.mockResolvedValue({ id: 'existing-id', ...dto });

      // Act & Assert
      await expect(service.create(dto as any)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated and filtered list of services (Get All, Pagination, Search)', async () => {
      // Arrange
      const query = { page: 2, limit: 5, search: 'Test', active: true };
      const expectedWhere = {
        isActive: true,
        OR: [
          { title: { contains: 'Test', mode: 'insensitive' } },
          { description: { contains: 'Test', mode: 'insensitive' } },
        ],
      };
      
      mockPrismaService.service.findMany.mockResolvedValue([{ id: '1', title: 'Test' }]);
      mockPrismaService.service.count.mockResolvedValue(12);

      // Act
      const result = await service.findAll(query as any);

      // Assert
      expect(mockPrismaService.service.findMany).toHaveBeenCalledWith({
        where: expectedWhere,
        skip: 5,
        take: 5,
        orderBy: { createdAt: 'desc' },
      });
      expect(mockPrismaService.service.count).toHaveBeenCalledWith({ where: expectedWhere });
      expect(result.data.length).toEqual(1);
      expect(result.meta).toEqual({
        total: 12,
        page: 2,
        limit: 5,
        totalPages: 3,
      });
    });
  });

  describe('findOne', () => {
    it('should return a service by ID (Get By ID)', async () => {
      // Arrange
      mockPrismaService.service.findUnique.mockResolvedValue({ id: '1', title: 'Test' });

      // Act
      const result = await service.findOne('1');

      // Assert
      expect(mockPrismaService.service.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(result.title).toEqual('Test');
    });

    it('should throw NotFoundException if service is not found', async () => {
      // Arrange
      mockPrismaService.service.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a service successfully (Update)', async () => {
      // Arrange
      const dto = { title: 'New Title' };
      // First call (findOne internal)
      mockPrismaService.service.findUnique.mockResolvedValueOnce({ id: '1', title: 'Old Title' });
      // Second call (title duplication check)
      mockPrismaService.service.findUnique.mockResolvedValueOnce(null);
      
      mockPrismaService.service.update.mockResolvedValue({ id: '1', title: 'New Title' });

      // Act
      const result = await service.update('1', dto);

      // Assert
      expect(mockPrismaService.service.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: dto,
      });
      expect(result.title).toEqual('New Title');
    });

    it('should throw ConflictException if new title is already taken', async () => {
      // Arrange
      const dto = { title: 'Existing Title' };
      mockPrismaService.service.findUnique.mockResolvedValueOnce({ id: '1', title: 'Old Title' });
      mockPrismaService.service.findUnique.mockResolvedValueOnce({ id: '2', title: 'Existing Title' }); // Taken by id '2'

      // Act & Assert
      await expect(service.update('1', dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should delete a service successfully (Delete)', async () => {
      // Arrange
      mockPrismaService.service.findUnique.mockResolvedValue({ id: '1', title: 'To Delete' });
      mockPrismaService.service.delete.mockResolvedValue({ id: '1' });

      // Act
      await service.remove('1');

      // Assert
      expect(mockPrismaService.service.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('should throw NotFoundException when deleting a non-existent service', async () => {
      // Arrange
      mockPrismaService.service.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove('1')).rejects.toThrow(NotFoundException);
    });
  });
});
