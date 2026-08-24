import { Controller, Post, Body, Req, Use } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @Public()
  async register(@Body() userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    return this.authService.register(userData);
  }

  @Post('login')
  @Public()
  async login(@Body() loginDto: {
    email: string;
    password: string;
  }) {
    return this.authService.login(loginDto);
  }
}
