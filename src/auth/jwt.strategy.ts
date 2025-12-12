import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Token Header se nikaalo
      ignoreExpiration: false, // Expired token reject karo
      secretOrKey: 'MY_SUPER_SECRET_KEY', // Same key jo AuthModule mein use ki thi
    });
  }

  async validate(payload: any) {
    // Req.user mein yeh data set ho jayega
    return { userId: payload.sub, username: payload.username, role: payload.role };
  }
}