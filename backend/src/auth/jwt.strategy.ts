import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthUser } from '../common/decorators';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private users: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  /** Runs after the token signature is verified. The returned object becomes `request.user`. */
  async validate(payload: { sub: string }): Promise<AuthUser> {
    const user = await this.users.findOne(payload.sub).catch(() => null);
    if (!user || !user.isActive) throw new UnauthorizedException('Account not available');
    return { id: String(user._id), email: user.email, fullName: user.fullName, role: user.role };
  }
}
