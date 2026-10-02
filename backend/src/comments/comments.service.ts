import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  COMMENT_MAX_LENGTH,
  COMMENT_MIN_LENGTH,
} from './comments.constants.js';

export { COMMENT_MAX_LENGTH, COMMENT_MIN_LENGTH };

const userSelect = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
} as const;

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForPlace(placeId: string, viewerId?: string | null) {
    const comments = await this.prisma.placeComment.findMany({
      where: { placeId },
      include: {
        user: { select: userSelect },
        _count: { select: { upvotes: true } },
        upvotes: viewerId
          ? { where: { userId: viewerId }, select: { id: true }, take: 1 }
          : false,
      },
    });

    return comments
      .map((c) => ({
        id: c.id,
        placeId: c.placeId,
        body: c.body,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        user: c.user,
        upvoteCount: c._count.upvotes,
        upvotedByMe: Array.isArray(c.upvotes) ? c.upvotes.length > 0 : false,
        isMine: viewerId ? c.userId === viewerId : false,
      }))
      .sort((a, b) => {
        if (b.upvoteCount !== a.upvoteCount) return b.upvoteCount - a.upvoteCount;
        return +new Date(b.createdAt) - +new Date(a.createdAt);
      });
  }

  async create(placeId: string, user: User, body: string) {
    const place = await this.prisma.hauntedPlace.findFirst({
      where: { id: placeId, status: 'approved' },
      select: { id: true },
    });
    if (!place) throw new NotFoundException('Place not found');

    const existing = await this.prisma.placeComment.findUnique({
      where: { placeId_userId: { placeId, userId: user.id } },
    });
    if (existing) {
      throw new ConflictException(
        'You already commented on this place. Delete your comment to post again.',
      );
    }

    const comment = await this.prisma.placeComment.create({
      data: { placeId, userId: user.id, body: body.trim() },
      include: {
        user: { select: userSelect },
        _count: { select: { upvotes: true } },
      },
    });

    return {
      id: comment.id,
      placeId: comment.placeId,
      body: comment.body,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      user: comment.user,
      upvoteCount: 0,
      upvotedByMe: false,
      isMine: true,
    };
  }

  async remove(commentId: string, user: User) {
    const comment = await this.prisma.placeComment.findUnique({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException('Comment not found');

    const isMod = user.role === 'admin' || user.role === 'contributor';
    if (comment.userId !== user.id && !isMod) {
      throw new ForbiddenException('You can only delete your own comment');
    }

    await this.prisma.placeComment.delete({ where: { id: commentId } });
    return { success: true };
  }

  async toggleUpvote(commentId: string, userId: string) {
    const comment = await this.prisma.placeComment.findUnique({
      where: { id: commentId },
      select: { id: true },
    });
    if (!comment) throw new NotFoundException('Comment not found');

    const existing = await this.prisma.commentUpvote.findUnique({
      where: { commentId_userId: { commentId, userId } },
    });

    if (existing) {
      await this.prisma.commentUpvote.delete({ where: { id: existing.id } });
    } else {
      await this.prisma.commentUpvote.create({
        data: { commentId, userId },
      });
    }

    const upvoteCount = await this.prisma.commentUpvote.count({
      where: { commentId },
    });

    return {
      commentId,
      upvotedByMe: !existing,
      upvoteCount,
    };
  }
}
