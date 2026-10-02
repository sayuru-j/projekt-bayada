import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IsEnum, IsString, MinLength } from 'class-validator';
import type { AppRole, SubmissionStatus, User } from '@prisma/client';
import { PlacesService } from '../places/places.service.js';
import { UsersService } from '../users/users.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { Roles, RolesGuard } from '../common/guards/roles.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

class RejectDto {
  @IsString()
  @MinLength(3)
  reason!: string;
}

class RoleDto {
  @IsEnum(['user', 'contributor', 'admin'] as const)
  role!: AppRole;
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('contributor', 'admin')
export class AdminController {
  constructor(
    private readonly placesService: PlacesService,
    private readonly usersService: UsersService,
  ) {}

  @Get('places')
  list(@Query('status') status: SubmissionStatus = 'pending') {
    const allowed: SubmissionStatus[] = ['pending', 'approved', 'rejected'];
    const safe = allowed.includes(status) ? status : 'pending';
    return this.placesService.listByStatus(safe);
  }

  @Patch('places/:id/approve')
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.placesService.approve(id, user.id);
  }

  @Patch('places/:id/reject')
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() dto: RejectDto,
  ) {
    return this.placesService.reject(id, user.id, dto.reason);
  }

  /** Permanent delete — admins only (contributors cannot). */
  @Delete('places/:id')
  @Roles('admin')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.placesService.remove(id);
  }

  @Get('users')
  @Roles('admin')
  listUsers(
    @Query('q') q?: string,
    @Query('cursor') cursor?: string,
    @Query('take') takeRaw?: string,
  ) {
    const take = takeRaw ? Number.parseInt(takeRaw, 10) : 20;
    return this.usersService.listPaged({
      q,
      cursor,
      take: Number.isFinite(take) ? take : 20,
    });
  }

  @Patch('users/:id/role')
  @Roles('admin')
  setRole(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: User,
    @Body() dto: RoleDto,
  ) {
    if (actor.id === id && dto.role !== 'admin') {
      throw new ForbiddenException('You cannot remove your own admin role');
    }
    return this.usersService.setRole(id, dto.role);
  }
}
