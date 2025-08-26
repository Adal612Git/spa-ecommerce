import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'secret',
};

passport.use(
  new JwtStrategy(opts, async (payload, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) return done(null, false);
      return done(null, user);
    } catch (err) {
      return done(err as Error, false);
    }
  })
);

export const authenticate = passport.authenticate('jwt', { session: false });
