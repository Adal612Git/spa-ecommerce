import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as LocalStrategy } from 'passport-local';
import { PrismaClient } from '@prisma/client';
// eslint-disable-next-line import/no-unresolved
import { verifyPassword } from '../utils/password.js';

export const revokedTokens = new Set<string>();

let prisma: PrismaClient = new PrismaClient();

export function setPrismaClient(client: PrismaClient) {
  prisma = client;
}

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

passport.use(
  new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          return done(null, false);
        }
        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) {
          return done(null, false);
        }
        return done(null, user);
      } catch (err) {
        return done(err as Error);
      }
    }
  )
);

export const authenticate = passport.authenticate('jwt', { session: false });
