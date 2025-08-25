import { describe, it, expect } from 'vitest';
import { registerSchema } from '../src/routes/auth.js';

describe('validation schemas', () => {
  it('rejects invalid email', () => {
    const res = registerSchema.safeParse({ email: 'bad', password: 'password123' });
    expect(res.success).toBe(false);
  });

  it('rejects short password', () => {
    const res = registerSchema.safeParse({ email: 'a@b.com', password: 'short' });
    expect(res.success).toBe(false);
  });
});
