import { Module } from '@nestjs/common';
import { ClerkModule } from './clerk.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AdminGuard } from './admin.guard';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [ClerkModule, DatabaseModule],
  controllers: [AuthController],
  providers: [AuthService, AdminGuard],
  exports: [AuthService, ClerkModule, AdminGuard],
})
export class AuthModule {}
