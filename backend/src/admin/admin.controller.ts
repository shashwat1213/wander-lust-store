import { Controller, Get } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminService } from './admin.service';

/**
 * Admin dashboard aggregation. All routes require the ADMIN role.
 * Resource management (product/category/order mutations) lives on the
 * respective resource controllers, also guarded by @Roles(ADMIN).
 */
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboard();
  }
}
