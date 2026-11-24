import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsMongoId, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateCellDto {
  @ApiProperty({ example: 'A' }) @IsString() @MaxLength(20) block: string;
  @ApiProperty({ example: 'A-01' }) @IsString() @MaxLength(20) name: string;
  @ApiProperty({ example: 4 }) @IsInt() @Min(1) @Max(200) capacity: number;
}

export class UpdateCellDto {
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(200) capacity?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}

export class TransferDto {
  @ApiProperty({ description: 'Id of the cell to move the inmate into' }) @IsMongoId() toCellId: string;
  @ApiPropertyOptional({ example: 'Overcrowding in block B' }) @IsOptional() @IsString() @MaxLength(300) reason?: string;
}
