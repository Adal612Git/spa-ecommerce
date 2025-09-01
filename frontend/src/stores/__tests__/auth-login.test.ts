import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '../auth';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';

vi.mock('quasar', () => ({ useQuasar: vi.fn() }));
vi.mock('vue-router', () => ({ useRouter: vi.fn() }));

describe('auth login', () => {
  let notify: ReturnType<typeof vi.fn>;
  let push: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setActivePinia(createPinia());
    notify = vi.fn();
    push = vi.fn();
    (useQuasar as unknown as Mock).mockReturnValue({ notify });
    (useRouter as unknown as Mock).mockReturnValue({ push });
  });

  it('stores token on successful login', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ token: 'abc123' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: '1',
            email: 'test@example.com',
            role: 'USER',
            createdAt: '',
          }),
      }) as unknown as typeof fetch;

    const store = useAuthStore();
    await store.login('test@example.com', 'password');
    expect(store.token).toBe('abc123');
  });

  it('notifies on login error', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch;

    const store = useAuthStore();

    const onSubmit = async () => {
      try {
        await store.login('bad@example.com', 'bad');
        await push('/');
      } catch (error) {
        notify({
          type: 'negative',
          message: 'Error al iniciar sesión: ' + (error as Error).message,
        });
      }
    };

    await onSubmit();
    expect(notify).toHaveBeenCalledWith({
      type: 'negative',
      message: 'Error al iniciar sesión: Login failed',
    });
  });
});
