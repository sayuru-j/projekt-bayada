import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class EvidenceDto {
  @IsEnum(['image', 'youtube'] as const)
  mediaType!: 'image' | 'youtube';

  @IsString()
  @MinLength(1)
  url!: string;

  @IsOptional()
  @IsString()
  youtubeId?: string;
}

export class CreatePlaceDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title!: string;

  @IsString()
  @MinLength(20)
  @MaxLength(4000)
  description!: string;

  @IsUUID()
  categoryId!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  spookinessRating!: number;

  @IsNumber()
  @Min(5.7)
  @Max(10.0)
  latitude!: number;

  @IsNumber()
  @Min(79.2)
  @Max(82.3)
  longitude!: number;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  nearestCity!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EvidenceDto)
  evidence!: EvidenceDto[];
}

export class VerifyVisitDto {
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;
}
