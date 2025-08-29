export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  price_cents: number;
  currency: string;
  stock: number;
  image_url?: string;
}
