import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { SubmissionStatus, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CommentsService } from '../comments/comments.service.js';
import { extractYouTubeId } from '../common/utils.js';
import type { CreatePlaceDto } from './dto/place.dto.js';

const placeInclude = {
  media: true,
  category: true,
  createdBy: {
    select: { id: true, username: true, displayName: true, avatarUrl: true },
  },
  _count: { select: { visits: true } },
} as const;

@Injectable()
export class PlacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly commentsService: CommentsService,
  ) {}

  listApproved() {
    return this.prisma.hauntedPlace.findMany({
      where: { status: 'approved' },
      include: placeInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string, viewer?: User | null) {
    const place = await this.prisma.hauntedPlace.findUnique({
      where: { id },
      include: {
        ...placeInclude,
        visits: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { visitedAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!place) {
      throw new NotFoundException('Place not found');
    }

    const isOwner = viewer?.id === place.createdById;
    const isMod =
      viewer?.role === 'contributor' || viewer?.role === 'admin';

    if (place.status !== 'approved' && !isOwner && !isMod) {
      throw new NotFoundException('Place not found');
    }

    const myVisit = viewer
      ? place.visits.find((v) => v.userId === viewer.id) ?? null
      : null;

    const comments = await this.commentsService.listForPlace(
      id,
      viewer?.id ?? null,
    );

    return { ...place, myVisit, comments };
  }

  listMine(userId: string) {
    return this.prisma.hauntedPlace.findMany({
      where: { createdById: userId },
      include: placeInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  listByStatus(status: SubmissionStatus) {
    return this.prisma.hauntedPlace.findMany({
      where: { status },
      include: {
        ...placeInclude,
        reviewedBy: {
          select: { id: true, username: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(userId: string, dto: CreatePlaceDto) {
    if (!dto.evidence.length) {
      throw new BadRequestException('At least one image or YouTube link is required');
    }

    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new BadRequestException('Invalid category');
    }

    const mediaData = dto.evidence.map((item) => {
      if (item.mediaType === 'youtube') {
        const youtubeId = item.youtubeId || extractYouTubeId(item.url);
        if (!youtubeId) {
          throw new BadRequestException(`Invalid YouTube URL: ${item.url}`);
        }
        return {
          mediaType: 'youtube' as const,
          url: item.url,
          youtubeId,
          uploadedById: userId,
        };
      }
      return {
        mediaType: 'image' as const,
        url: item.url,
        youtubeId: null,
        uploadedById: userId,
      };
    });

    return this.prisma.hauntedPlace.create({
      data: {
        title: dto.title,
        description: dto.description,
        categoryId: dto.categoryId,
        spookinessRating: dto.spookinessRating,
        latitude: dto.latitude,
        longitude: dto.longitude,
        nearestCity: dto.nearestCity,
        status: 'pending',
        createdById: userId,
        media: { create: mediaData },
      },
      include: placeInclude,
    });
  }

  async approve(placeId: string, reviewerId: string) {
    const place = await this.prisma.hauntedPlace.findUnique({ where: { id: placeId } });
    if (!place) throw new NotFoundException('Place not found');

    return this.prisma.hauntedPlace.update({
      where: { id: placeId },
      data: {
        status: 'approved',
        reviewedById: reviewerId,
        rejectionReason: null,
      },
      include: placeInclude,
    });
  }

  async reject(placeId: string, reviewerId: string, reason: string) {
    const place = await this.prisma.hauntedPlace.findUnique({ where: { id: placeId } });
    if (!place) throw new NotFoundException('Place not found');

    return this.prisma.hauntedPlace.update({
      where: { id: placeId },
      data: {
        status: 'rejected',
        reviewedById: reviewerId,
        rejectionReason: reason,
      },
      include: placeInclude,
    });
  }

  async remove(placeId: string) {
    const place = await this.prisma.hauntedPlace.findUnique({ where: { id: placeId } });
    if (!place) throw new NotFoundException('Place not found');

    await this.prisma.hauntedPlace.delete({ where: { id: placeId } });
    return { ok: true, id: placeId };
  }
}
