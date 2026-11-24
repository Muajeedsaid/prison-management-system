import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { Role } from '../common/roles';

interface JwtPayload {
  sub: string;
  role: Role;
}

@Injectable()
export class AuthService {
  constructor(
    private users: UsersService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.users.findByEmailWithSecrets(email);
    // Same message for "no such user" and "wrong password" so attackers cannot probe for accounts.
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (!user.isActive) throw new UnauthorizedException('This account has been deactivated');
    return this.issueTokens(user.id, user.role, {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    });
  }

  async refresh(refreshToken: string) {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }
    const user = await this.users.findByIdWithRefresh(payload.sub);
    if (!user || !user.isActive || !user.refreshTokenHash || !(await bcrypt.compare(refreshToken, user.refreshTokenHash))) {
      throw new UnauthorizedException('Refresh token is no longer valid');
    }
    return this.issueTokens(user.id, user.role, {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    });
  }

  async logout(userId: string) {
    await this.users.setRefreshHash(userId, null);
    return { message: 'Logged out' };
  }

  private async issueTokens(
    id: string,
    role: Role,
    user: { id: string; email: string; fullName: string; role: Role },
  ) {
    const payload: JwtPayload = { sub: id, role };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get('JWT_ACCESS_EXPIRES', '15m'),
    });
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get('JWT_REFRESH_EXPIRES', '7d'),
    });
    // Only a hash of the refresh token is stored, so a database leak cannot be replayed.
    await this.users.setRefreshHash(id, await bcrypt.hash(refreshToken, 10));
    return { accessToken, refreshToken, user };
  }
}
