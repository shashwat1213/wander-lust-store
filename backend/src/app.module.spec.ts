import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module';
import { PrismaService } from './common/prisma/prisma.service';
import { AuthService } from './auth/auth.service';

describe('AppModule (DI graph)', () => {
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      // Avoid a real DB connection during the DI smoke test.
      .overrideProvider(PrismaService)
      .useValue({
        $connect: jest.fn(),
        $disconnect: jest.fn(),
        user: { findUnique: jest.fn() },
      })
      .compile();
  });

  afterAll(async () => {
    await moduleRef?.close();
  });

  it('compiles the full application dependency graph', () => {
    expect(moduleRef).toBeDefined();
  });

  it('wires the auth feature module into the application graph', () => {
    // Compiling AppModule eagerly instantiates the APP_GUARD providers
    // (JwtAuthGuard + RolesGuard); an unmet guard dependency would have
    // thrown during compile(). AuthService resolving confirms the auth
    // module is wired in.
    expect(moduleRef.get(AuthService)).toBeInstanceOf(AuthService);
  });
});
