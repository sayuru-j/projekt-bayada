import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { User } from '@prisma/client';
import { VisitsService } from './visits.service.js';
import { VerifyVisitDto } from '../places/dto/place.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@Controller('places')
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @Post(':id/visit')
  @UseGuards(JwtAuthGuard)
  verify(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() dto: VerifyVisitDto,
  ) {
    return this.visitsService.verifyAndLog(
      id,
      user.id,
      dto.latitude,
      dto.longitude,
    );
  }
}
