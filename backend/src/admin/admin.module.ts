import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller.js';
import { PlacesModule } from '../places/places.module.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [PlacesModule, UsersModule],
  controllers: [AdminController],
})
export class AdminModule {}
