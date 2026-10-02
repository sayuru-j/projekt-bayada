import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CommentVoteType, User } from '@prisma/client';
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

type VoteCounts = { upvoteCount: number; downvoteCount: number };

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  private async voteCounts(commentId: string): Promise<VoteCounts> {
    const [upvoteCount, downvoteCount] = await Promise.all([
      this.prisma.commentVote.count({ where: { commentId, type: 'up' } }),
      this.prisma.commentVote.count({ where: { commentId, type: 'down' } }),
    ]);
    return { upvoteCount, downvoteCount };
  }

  async listForPlace(placeId: string, viewerId?: string | null) {
    const comments = await this.prisma.placeComment.findMany({
      where: { placeId },
      include: {
        user: { select: userSelect },
        votes: {
          select: {
            type: true,
            userId: true,
          },
        },
      },
    });

    return comments
      .map((c) => {
        const upvoteCount = c.votes.filter((v) => v.type === 'up').length;
        const downvoteCount = c.votes.filter((v) => v.type === 'down').length;
        const my = viewerId
          ? c.votes.find((v) => v.userId === viewerId)
          : undefined;
        return {
          id: c.id,
          placeId: c.placeId,
          body: c.body,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          user: c.user,
          upvoteCount,
          downvoteCount,
          myVote: (my?.type ?? null) as CommentVoteType | null,
          isMine: viewerId ? c.userId === viewerId : false,
        };
      })
      .sort((a, b) => {
        const scoreA = a.upvoteCount - a.downvoteCount;
        const scoreB = b.upvoteCount - b.downvoteCount;
        if (scoreB !== scoreA) return scoreB - scoreA;
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
      include: { user: { select: userSelect } },
    });

    return {
      id: comment.id,
      placeId: comment.placeId,
      body: comment.body,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      user: comment.user,
      upvoteCount: 0,
      downvoteCount: 0,
      myVote: null,
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

  async castVote(commentId: string, userId: string, type: CommentVoteType) {
    const comment = await this.prisma.placeComment.findUnique({
      where: { id: commentId },
      select: { id: true },
    });
    if (!comment) throw new NotFoundException('Comment not found');

    const existing = await this.prisma.commentVote.findUnique({
      where: { commentId_userId: { commentId, userId } },
    });

    let myVote: CommentVoteType | null;

    if (!existing) {
      await this.prisma.commentVote.create({
        data: { commentId, userId, type },
      });
      myVote = type;
    } else if (existing.type === type) {
      await this.prisma.commentVote.delete({ where: { id: existing.id } });
      myVote = null;
    } else {
      await this.prisma.commentVote.update({
        where: { id: existing.id },
        data: { type },
      });
      myVote = type;
    }

    const counts = await this.voteCounts(commentId);
    return { commentId, myVote, ...counts };
  }
}
