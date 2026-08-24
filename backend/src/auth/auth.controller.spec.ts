import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { Role } from '@prisma/client';
import { AuthController } from './auth.controller';
import { AuthService, SafeUser } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    register: jest.Mock;
    login: jest.Mock;
  };

  const safeUser: SafeUser = {
    id: 'user-1',
    email: 'traveler@wanderlust.dev',
    firstName: 'Ada',
    lastName: 'Lovelace',
    role: Role.CUSTOMER,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    authService = {
      register: jest.fn(),
      login: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('login', () => {
    it('logs in the guard-validated req.user, NOT the raw request body', async () => {
      authService.login.mockResolvedValue({ access_token: 'token' });
      const body = { email: safeUser.email, password: 'irrelevant-here' };
      const req = { user: safeUser } as unknown as Request;

      const result = await controller.login(body, req);

      // Regression guard: the previous implementation forwarded the raw body
      // (with sub/role undefined and no password check). It MUST use req.user.
      expect(authService.login).toHaveBeenCalledWith(safeUser);
      expect(authService.login).not.toHaveBeenCalledWith(body);
      expect(result).toEqual({ access_token: 'token' });
    });
  });

  describe('register', () => {
    it('delegates registration to the auth service', async () => {
      authService.register.mockResolvedValue(safeUser);
      const dto = {
        email: 'new@wanderlust.dev',
        password: 'plaintext-password',
        firstName: 'Grace',
        lastName: 'Hopper',
      };

      const result = await controller.register(dto);

      expect(authService.register).toHaveBeenCalledWith(dto);
      expect(result).toBe(safeUser);
    });
  });
});
