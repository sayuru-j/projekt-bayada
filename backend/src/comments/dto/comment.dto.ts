import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';
import {
  COMMENT_MAX_LENGTH,
  COMMENT_MIN_LENGTH,
} from '../comments.constants.js';

export class CreateCommentDto {
  @IsString()
  @MinLength(COMMENT_MIN_LENGTH)
  @MaxLength(COMMENT_MAX_LENGTH)
  body!: string;
}

export class VoteCommentDto {
  @IsString()
  @IsIn(['up', 'down'])
  type!: 'up' | 'down';
}
