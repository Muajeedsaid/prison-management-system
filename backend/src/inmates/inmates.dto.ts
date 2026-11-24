import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { PaginationQuery } from '../common/pagination';
import { Gender, InmateStatus } from './inmate.schema';

export class NextOfKinDto {
  @ApiProperty({ example: 'Sample Relative' }) @IsString() @MinLength(2) @MaxLength(100) name: string;
  @ApiProperty({ example: '08000000000' }) @IsString() @MinLength(5) @MaxLength(20) phone: string;
  @ApiPropertyOptional({ example: 'Brother' }) @IsOptional() @IsString() @MaxLength(50) relationship?: string;
}

export class CreateInmateDto {
  @ApiProperty({ example: 'Sample Person' }) @IsString() @MinLength(2) @MaxLength(120) fullName: string;
  @ApiProperty({ example: '1990-04-12' }) @IsDateString() dateOfBirth: string;
  @ApiProperty({ enum: Gender }) @IsEnum(Gender) gender: Gender;
  @ApiPropertyOptional({ enum: InmateStatus, default: InmateStatus.AWAITING_TRIAL })
  @IsOptional()
  @IsEnum(InmateStatus)
  status?: InmateStatus;
  @ApiProperty({ example: '2026-11-01' }) @IsDateString() admissionDate: string;
  @ApiPropertyOptional({ example: 24, description: 'Sentence length in months (convicted inmates)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1200)
  sentenceMonths?: number;
  @ApiPropertyOptional({ example: '2028-11-01' }) @IsOptional() @IsDateString() expectedReleaseDate?: string;
  @ApiPropertyOptional({ type: NextOfKinDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => NextOfKinDto)
  nextOfKin?: NextOfKinDto;
  @ApiPropertyOptional() @IsOptional() @IsUrl() photoUrl?: string;
}

export class UpdateInmateDto extends PartialType(CreateInmateDto) {}

export class ListInmatesQuery extends PaginationQuery {
  @ApiPropertyOptional({ description: 'Search by name or inmate number', example: 'ibrahim' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ enum: InmateStatus })
  @IsOptional()
  @IsEnum(InmateStatus)
  status?: InmateStatus;

  @ApiPropertyOptional({ description: 'Only inmates in this cell' })
  @IsOptional()
  @IsMongoId()
  cell?: string;
}
