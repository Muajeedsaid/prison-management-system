import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@pms.local' }) @IsEmail() email: string;
  @ApiProperty() @IsString() @MinLength(1) password: string;
}

export class RefreshDto {
  @ApiProperty() @IsString() refreshToken: string;
}
