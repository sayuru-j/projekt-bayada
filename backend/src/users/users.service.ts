import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppRole, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { slugifyUsername } from '../common/utils.js';
import type { GoogleProfileInput } from '../auth/auth.service.js';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findOrCreateFromGoogle(profile: GoogleProfileInput): Promise<User> {
    const existing = await this.prisma.user.findUnique({
      where: { googleId: profile.googleId },
    });
    if (existing) {
      return this.prisma.user.update({
        where: { id: existing.id },
        data: {
          displayName: profile.displayName ?? existing.displayName,
          avatarUrl: profile.avatarUrl ?? existing.avatarUrl,
        },
      });
    }

    const byEmail = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });
    if (byEmail) {
      return this.prisma.user.update({
        where: { id: byEmail.id },
        data: {
          googleId: profile.googleId,
          displayName: profile.displayName ?? byEmail.displayName,
          avatarUrl: profile.avatarUrl ?? byEmail.avatarUrl,
        },
      });
    }

    const username = await this.uniqueUsername(
      profile.displayName || profile.email.split('@')[0] || 'haunt',
    );

    const adminEmails = (this.config.get<string>('ADMIN_EMAILS') || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const role: AppRole = adminEmails.includes(profile.email.toLowerCase())
      ? 'admin'
      : 'user';

    return this.prisma.user.create({
      data: {
        googleId: profile.googleId,
        email: profile.email,
        username,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        role,
      },
    });
  }

  private async uniqueUsername(seed: string): Promise<string> {
    let base = slugifyUsername(seed);
    let candidate = base;
    let i = 0;
    while (await this.prisma.user.findUnique({ where: { username: candidate } })) {
      i += 1;
      candidate = `${base.slice(0, 16)}${i}`;
    }
    return candidate;
  }

  async updateUsername(userId: string, username: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { username: slugifyUsername(username) },
    });
  }

  async setRole(userId: string, role: AppRole) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async listPaged(opts: { q?: string; cursor?: string; take?: number }) {
    const take = Math.min(Math.max(opts.take ?? 20, 1), 50);
    const q = opts.q?.trim() ?? '';

    const where = q
      ? {
          OR: [
            { username: { contains: q, mode: 'insensitive' as const } },
            { email: { contains: q, mode: 'insensitive' as const } },
            { displayName: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : undefined;

    const items = await this.prisma.user.findMany({
      where,
      take: take + 1,
      ...(opts.cursor
        ? {
            skip: 1,
            cursor: { id: opts.cursor },
          }
        : {}),
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
        _count: { select: { places: true, visits: true } },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });

    const hasMore = items.length > take;
    const page = hasMore ? items.slice(0, take) : items;
    const nextCursor = hasMore ? page[page.length - 1]?.id ?? null : null;

    return { items: page, nextCursor };
  }
}
