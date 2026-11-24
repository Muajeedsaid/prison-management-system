import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { CaseStatus } from './case.schema';

export class BailDto {
  @ApiProperty() @IsBoolean() granted: boolean;
  @ApiPropertyOptional({ example: 500000 }) @IsOptional() @IsNumber() @Min(0) amount?: number;
}

export class CreateCaseDto {
  @ApiProperty({ example: 'KN/HC/123/2026' }) @IsString() @MaxLength(60) caseNumber: string;
  @ApiPropertyOptional({ example: ['Theft'], type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  charges?: string[];
  @ApiPropertyOptional({ example: 'High Court, Kano' }) @IsOptional() @IsString() @MaxLength(120) court?: string;
  @ApiPropertyOptional({ example: '2026-12-10' }) @IsOptional() @IsDateString() nextCourtDate?: string;
}

export class UpdateCaseDto extends PartialType(CreateCaseDto) {
  @ApiPropertyOptional({ enum: CaseStatus }) @IsOptional() @IsEnum(CaseStatus) status?: CaseStatus;
  @ApiPropertyOptional({ type: BailDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BailDto)
  bail?: BailDto;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) judgment?: string;
  @ApiPropertyOptional({ example: 24 }) @IsOptional() @IsInt() @Min(1) @Max(1200) sentenceMonths?: number;
}
