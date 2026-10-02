import { Body, Controller, Patch, UseGuards } from '@nestjs/common';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';
import type { User } from '@prisma/client';
import { UsersService } from './users.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

class UpdateUsernameDto {
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9_]+$/)
  username!: string;
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('me/username')
  @UseGuards(JwtAuthGuard)
  async updateUsername(
    @CurrentUser() user: User,
    @Body() dto: UpdateUsernameDto,
  ) {
    const updated = await this.usersService.updateUsername(user.id, dto.username);
    return {
      id: updated.id,
      email: updated.email,
      username: updated.username,
      displayName: updated.displayName,
      avatarUrl: updated.avatarUrl,
      role: updated.role,
      createdAt: updated.createdAt,
    };
  }
}
