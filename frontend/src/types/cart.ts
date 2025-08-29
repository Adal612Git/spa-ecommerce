export interface CartItem {
  productId: number;
  name: string;
  price_cents: number;
  currency: string;
  qty: number;
  stock: number;
  image_url?: string;
}
