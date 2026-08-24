import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Triggers the passport `local` strategy (email + password) so that
 * `LocalStrategy.validate` runs and populates `req.user` with the
 * authenticated user before the login handler executes.
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
