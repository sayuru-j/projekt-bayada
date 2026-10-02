import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { distanceMeters } from '../common/utils.js';

/** Max distance from the place pin to accept a GPS claim. */
const VISIT_RADIUS_METERS = 500;

@Injectable()
export class VisitsService {
  constructor(private readonly prisma: PrismaService) {}

  async verifyAndLog(placeId: string, userId: string, lat: number, lng: number) {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw new BadRequestException('Valid latitude and longitude are required');
    }

    const place = await this.prisma.hauntedPlace.findFirst({
      where: { id: placeId, status: 'approved' },
    });

    if (!place) {
      return {
        success: false,
        message: 'Location not found or not approved',
      };
    }

    const distance = Math.round(
      distanceMeters(place.latitude, place.longitude, lat, lng) * 10,
    ) / 10;

    if (distance > VISIT_RADIUS_METERS) {
      return {
        success: false,
        distance,
        requiredWithinMeters: VISIT_RADIUS_METERS,
        message: `You are ${Math.round(distance)} m away. Get within ${VISIT_RADIUS_METERS} m of this place to claim your visit.`,
      };
    }

    await this.prisma.placeVisit.upsert({
      where: {
        placeId_userId: { placeId, userId },
      },
      create: {
        placeId,
        userId,
        checkInLat: lat,
        checkInLng: lng,
      },
      update: {
        checkInLat: lat,
        checkInLng: lng,
      },
    });

    return {
      success: true,
      distance,
      requiredWithinMeters: VISIT_RADIUS_METERS,
      message: 'Verified! You survived.',
    };
  }
}
