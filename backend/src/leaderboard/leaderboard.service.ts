import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  async global(limit = 20) {
    const grouped = await this.prisma.placeVisit.groupBy({
      by: ['userId'],
      _count: { userId: true },
      orderBy: { _count: { userId: 'desc' } },
      take: limit,
    });

    const users = await this.prisma.user.findMany({
      where: { id: { in: grouped.map((g) => g.userId) } },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
      },
    });

    const byId = new Map(users.map((u) => [u.id, u]));

    return grouped.map((g, index) => ({
      rank: index + 1,
      visitCount: g._count.userId,
      user: byId.get(g.userId) ?? null,
    }));
  }
}
