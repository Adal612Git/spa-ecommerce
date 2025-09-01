import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import fs from 'fs';
import path from 'path';

vi.mock('src/api/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('quasar', () => ({
  Notify: { create: vi.fn() },
}));

import { useProductsStore } from '../products';
import { useOrdersStore } from '../orders';
import { api } from 'src/api/api';
import { Notify } from 'quasar';

describe('stores error handling', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    (Notify.create as unknown as Mock).mockReset();
  });

  it('notifies unauthorized on 401', async () => {
    (api.get as unknown as Mock).mockRejectedValueOnce({ response: { status: 401 } });
    const store = useProductsStore();
    await store.fetch();
    expect(Notify.create).toHaveBeenCalledWith({
      type: 'negative',
      message: 'No autorizado, inicia sesión como admin',
    });
  });

  it('notifies generic error on 500', async () => {
    (api.get as unknown as Mock).mockRejectedValueOnce({ response: { status: 500 } });
    const store = useOrdersStore();
    await store.fetch();
    expect(Notify.create).toHaveBeenCalledWith({
      type: 'negative',
      message: 'Error inesperado, inténtalo de nuevo',
    });
  });

  it('stores have no any keyword', () => {
    const productsSrc = fs.readFileSync(path.resolve(__dirname, '../products.ts'), 'utf8');
    const ordersSrc = fs.readFileSync(path.resolve(__dirname, '../orders.ts'), 'utf8');
    expect(productsSrc).not.toMatch(/\bany\b/);
    expect(ordersSrc).not.toMatch(/\bany\b/);
  });
});

