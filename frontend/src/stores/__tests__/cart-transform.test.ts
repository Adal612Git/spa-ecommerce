import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

const axiosInstance = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
})) as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
};
vi.mock('axios', () => ({
  default: { create: () => axiosInstance },
  create: () => axiosInstance,
}));

vi.mock('quasar', () => ({ useQuasar: vi.fn() }));

import { useCartStore } from '../cart';
import { useAuthStore } from '../auth';
import { useQuasar } from 'quasar';

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('cart store transform', () => {
  let notify: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setActivePinia(createPinia());
    notify = vi.fn();
    (useQuasar as unknown as Mock).mockReturnValue({ notify });
    axiosInstance.get.mockReset();
    axiosInstance.post.mockReset();
    // stub localStorage
    globalThis.localStorage = {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
      clear: () => undefined,
      key: () => null,
      length: 0,
    } as Storage;
  });

  it('maps backend items and calculates subtotal', async () => {
    axiosInstance.get.mockResolvedValue({
      data: {
        items: [
          { quantity: 2, product: { id: 1, name: 'Taza', priceCents: 1299 } },
        ],
      },
    });

    const auth = useAuthStore();
    const store = useCartStore();

    auth.token = 'token';
    await flushPromises();
    await flushPromises();

    expect(store.cart[0]).toMatchObject({
      productId: 1,
      name: 'Taza',
      priceCents: 1299,
      qty: 2,
    });
    expect(store.subtotal).toBe(2598);
  });
});

