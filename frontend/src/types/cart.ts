export interface CartItem {
  productId: number;
  name: string;
  priceCents: number;
  currency: string;
  qty: number;
  stock: number;
  image_url?: string;
}
