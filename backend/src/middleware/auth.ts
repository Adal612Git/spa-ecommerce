import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { PrismaClient } from '@prisma/client';

export const revokedTokens = new Set<string>();

const prisma = new PrismaClient();

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'secret',
  passReqToCallback: true,
};

passport.use(
  new JwtStrategy(opts, async (req, payload, done) => {
    try {
      const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req) as string | null;
      if (token && revokedTokens.has(token)) {
        return done(null, false);
      }
      const user = await prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) return done(null, false);
      return done(null, user);
    } catch (err) {
      return done(err as Error, false);
    }
  })
);

export const authenticate = passport.authenticate('jwt', { session: false });
