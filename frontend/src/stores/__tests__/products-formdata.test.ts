import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

vi.mock('src/api/api', () => ({
  api: {
    post: vi.fn(),
    put: vi.fn(),
    get: vi.fn(),
  },
}));

vi.mock('quasar', () => ({
  Notify: { create: vi.fn() },
}));

import { useProductsStore } from '../products';
import { api } from 'src/api/api';
import { Notify } from 'quasar';

describe('products store formdata', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    (api.post as unknown as Mock).mockReset();
    (api.put as unknown as Mock).mockReset();
    (api.get as unknown as Mock).mockReset();
    (Notify.create as unknown as Mock).mockReset();
  });

  it('sends formdata and notifies success', async () => {
    (api.post as unknown as Mock).mockResolvedValueOnce({ status: 201 });
    (api.get as unknown as Mock).mockResolvedValueOnce({ data: [] });
    const store = useProductsStore();
    const file = new File(['hello'], 'img.png', { type: 'image/png' });
    await store.save(
      {
        name: 'Test',
        description: 'desc',
        price: 1,
        stock: 5,
        category: 'cat',
        status: 'ACTIVE' as const,
      },
      [file],
    );
    const body = (api.post as unknown as Mock).mock.calls?.[0]?.[1] as FormData;
    expect(body).toBeInstanceOf(FormData);
    expect(body.get('name')).toBe('Test');
    expect(body.get('priceCents')).toBe('100');
    expect(body.getAll('images')).toHaveLength(1);
    expect(Notify.create).toHaveBeenCalledWith({
      type: 'positive',
      message: 'Producto guardado',
    });
  });

  it('notifies error on failure', async () => {
    (api.post as unknown as Mock).mockRejectedValueOnce({ response: { status: 400, data: { message: 'Bad' } } });
    (api.get as unknown as Mock).mockResolvedValueOnce({ data: [] });
    const store = useProductsStore();
    await expect(
      store.save(
        {
          name: 'Bad',
          description: 'd',
          price: 1,
          stock: 5,
          category: 'cat',
          status: 'ACTIVE' as const,
        },
        [],
      ),
    ).rejects.toBeDefined();
    expect(Notify.create).toHaveBeenCalledWith({
      type: 'negative',
      message: 'Bad',
    });
  });
});
