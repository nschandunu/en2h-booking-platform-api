import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma, Service } from '@prisma/client';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { QueryServiceDto } from './dto/query-service.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createServiceDto: CreateServiceDto): Promise<Service> {
    const existing = await this.prisma.service.findUnique({
      where: { title: createServiceDto.title },
    });

    if (existing) {
      throw new ConflictException('A service with this title already exists.');
    }

    return this.prisma.service.create({
      data: createServiceDto,
    });
  }

  async findAll(query: QueryServiceDto) {
    const { page = 1, limit = 10, search, active } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ServiceWhereInput = {};
    if (active !== undefined) {
      where.isActive = active;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.service.count({ where }),
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

  async findOne(id: string): Promise<Service> {
    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }
    return service;
  }

  async update(
    id: string,
    updateServiceDto: UpdateServiceDto,
  ): Promise<Service> {
    // Check if the service exists
    await this.findOne(id);

    // If title is being updated, check for duplicates
    if (updateServiceDto.title) {
      const existing = await this.prisma.service.findUnique({
        where: { title: updateServiceDto.title },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          'A service with this title already exists.',
        );
      }
    }

    return this.prisma.service.update({
      where: { id },
      data: updateServiceDto,
    });
  }

  async remove(id: string): Promise<Service> {
    // Check if the service exists
    await this.findOne(id);
    return this.prisma.service.delete({ where: { id } });
  }
}
