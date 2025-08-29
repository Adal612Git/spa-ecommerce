export interface Review {
  id: number;
  product: { name: string };
  rating: number;
  comment: string;
  status: string;
}
