import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../common/prisma/prisma.service';

jest.mock('bcryptjs');

const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
  };
  let jwt: { sign: jest.Mock };

  const baseUser = {
    id: 'user-1',
    email: 'traveler@wanderlust.dev',
    password: 'hashed-password',
    firstName: 'Ada',
    lastName: 'Lovelace',
    role: Role.CUSTOMER,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };
    jwt = { sign: jest.fn().mockReturnValue('signed-jwt-token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('validateUser', () => {
    it('returns the user without the password hash when credentials are valid', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.validateUser(
        baseUser.email,
        'correct-password',
      );

      expect(result).not.toBeNull();
      expect(result).not.toHaveProperty('password');
      expect(result).toMatchObject({ id: baseUser.id, email: baseUser.email });
    });

    it('returns null when the password does not match', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      const result = await service.validateUser(
        baseUser.email,
        'wrong-password',
      );

      expect(result).toBeNull();
    });

    it('returns null when the user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser('ghost@none.dev', 'whatever');

      expect(result).toBeNull();
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('signs a JWT with sub, email and role from the authenticated user', async () => {
      const { password: _pw, ...safeUser } = baseUser;

      const result = await service.login(safeUser);

      expect(jwt.sign).toHaveBeenCalledWith({
        email: baseUser.email,
        sub: baseUser.id,
        role: baseUser.role,
      });
      expect(result).toEqual({ access_token: 'signed-jwt-token' });
    });
  });

  describe('register', () => {
    it('hashes the password, defaults the role to CUSTOMER and strips the hash from the result', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue('freshly-hashed' as never);
      prisma.user.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ ...baseUser, ...data }),
      );

      const result = await service.register({
        email: 'new@wanderlust.dev',
        password: 'plaintext-password',
        firstName: 'Grace',
        lastName: 'Hopper',
      });

      const createArg = prisma.user.create.mock.calls[0][0];
      expect(createArg.data.password).toBe('freshly-hashed');
      expect(createArg.data.password).not.toBe('plaintext-password');
      expect(createArg.data.role).toBe(Role.CUSTOMER);
      expect(result).not.toHaveProperty('password');
    });

    it('rejects registration when the email is already taken', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);

      await expect(
        service.register({
          email: baseUser.email,
          password: 'plaintext-password',
          firstName: 'Grace',
          lastName: 'Hopper',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });
});
