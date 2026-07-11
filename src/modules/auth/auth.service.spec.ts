import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@database/prisma.service';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';

jest.mock('bcrypt');

describe('AuthService', () => {
  let authService: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockPrismaService = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    decode: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'jwt.refreshSecret') return 'test-refresh-secret';
      if (key === 'jwt.refreshExpiresIn') return '7d';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        UsersService, // Providing the real UsersService so we test its integration with Prisma
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a user (Register success)', async () => {
      // Arrange
      const dto = { name: 'Test', email: 'test@test.com', password: 'password123' };
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      
      const savedUser = {
        id: 'user-id',
        name: dto.name,
        email: dto.email,
        password: 'hashedPassword',
        refreshToken: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.user.create.mockResolvedValue(savedUser);

      // Act
      const result = await authService.register(dto);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 10);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          name: dto.name,
          email: dto.email,
          password: 'hashedPassword',
        }
      });
      expect(result.message).toEqual('User registered successfully');
      expect(result.data).not.toHaveProperty('password');
      expect(result.data.email).toEqual(dto.email);
    });

    it('should throw error if email is duplicate (Duplicate email)', async () => {
      // Arrange
      const dto = { name: 'Test', email: 'duplicate@test.com', password: 'password123' };
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      
      // Simulate Prisma Unique Constraint Violation
      mockPrismaService.user.create.mockRejectedValue(new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '7.8.0' }
      ));

      // Act & Assert
      await expect(authService.register(dto)).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('should return tokens on valid credentials (Login success)', async () => {
      // Arrange
      const dto = { email: 'test@test.com', password: 'password123' };
      const user = {
        id: 'user-id',
        email: dto.email,
        password: 'hashedPassword',
      };
      
      mockPrismaService.user.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('newRefreshHash');
      mockJwtService.signAsync.mockResolvedValueOnce('access-token').mockResolvedValueOnce('refresh-token');
      mockPrismaService.user.update.mockResolvedValue({ ...user, refreshToken: 'newRefreshHash' });

      // Act
      const result = await authService.login(dto);

      // Assert
      expect(result.data.accessToken).toEqual('access-token');
      expect(result.data.refreshToken).toEqual('refresh-token');
      expect(mockPrismaService.user.update).toHaveBeenCalled();
    });

    it('should throw Unauthorized on wrong password (Wrong password)', async () => {
      // Arrange
      const dto = { email: 'test@test.com', password: 'wrong' };
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-id',
        password: 'hashedPassword',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(authService.login(dto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should nullify the refresh token (Logout)', async () => {
      // Arrange
      mockPrismaService.user.update.mockResolvedValue({});

      // Act
      const result = await authService.logout('user-id');

      // Assert
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        data: { refreshToken: null },
      });
      expect(result.message).toEqual('Logout successful');
    });
  });

  describe('refreshTokens', () => {
    it('should return new tokens on valid refresh token (Refresh token)', async () => {
      // Arrange
      const userId = 'user-id';
      const incomingRefreshToken = 'plain-refresh-token';
      const user = {
        id: userId,
        email: 'test@test.com',
        refreshToken: 'hashed-refresh-token',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-refresh-token');
      mockJwtService.signAsync.mockResolvedValueOnce('new-access').mockResolvedValueOnce('new-refresh');
      mockPrismaService.user.update.mockResolvedValue({});

      // Act
      const result = await authService.refreshTokens(userId, incomingRefreshToken);

      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith(incomingRefreshToken, 'hashed-refresh-token');
      expect(result.data.accessToken).toEqual('new-access');
      expect(result.data.refreshToken).toEqual('new-refresh');
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { refreshToken: 'new-hashed-refresh-token' },
      });
    });

    it('should throw ForbiddenException if refresh token hash mismatches (Invalid refresh token)', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-id',
        refreshToken: 'hashed-refresh-token',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(authService.refreshTokens('user-id', 'wrong-token')).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if user has no refresh token in DB', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-id',
        refreshToken: null,
      });

      // Act & Assert
      await expect(authService.refreshTokens('user-id', 'token')).rejects.toThrow(ForbiddenException);
    });
  });
});
