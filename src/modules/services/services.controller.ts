import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { QueryServiceDto } from './dto/query-service.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new service' })
  @ApiResponse({ status: 201, description: 'Service successfully created.' })
  @ApiResponse({ status: 400, description: 'Validation errors.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 409, description: 'Service title already exists.' })
  create(@Body() createServiceDto: CreateServiceDto) {
    return this.servicesService.create(createServiceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve a paginated list of services' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of services.',
  })
  findAll(@Query() queryServiceDto: QueryServiceDto) {
    return this.servicesService.findAll(queryServiceDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a specific service by ID' })
  @ApiParam({ name: 'id', description: 'UUID of the service' })
  @ApiResponse({ status: 200, description: 'Service found.' })
  @ApiResponse({ status: 404, description: 'Service not found.' })
  findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an existing service' })
  @ApiParam({ name: 'id', description: 'UUID of the service' })
  @ApiResponse({ status: 200, description: 'Service successfully updated.' })
  @ApiResponse({ status: 400, description: 'Validation errors.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Service not found.' })
  @ApiResponse({ status: 409, description: 'Service title already exists.' })
  update(@Param('id') id: string, @Body() updateServiceDto: UpdateServiceDto) {
    return this.servicesService.update(id, updateServiceDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a service permanently' })
  @ApiParam({ name: 'id', description: 'UUID of the service' })
  @ApiResponse({ status: 200, description: 'Service successfully deleted.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Service not found.' })
  remove(@Param('id') id: string) {
    return this.servicesService.remove(id);
  }
}
