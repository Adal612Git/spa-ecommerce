export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  priceCents: number;
  currency: string;
  stock: number;
  category: string;
  status: 'ACTIVE' | 'INACTIVE';
  image_url?: string;
}
