export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  priceCents: number;
  currency: string;
  stock: number;
  image_url?: string;
}
