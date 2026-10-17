import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { RolesGuard } from './guards/roles.guard';
import { ScopeGuard } from './guards/scope.guard';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RolesGuard, ScopeGuard],
  exports: [AuthService, RolesGuard, ScopeGuard, PassportModule],
})
export class AuthModule {}
