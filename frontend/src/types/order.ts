export interface Order {
  id: number;
  status: string;
  total_cents: number;
  currency: string;
  created_at?: string;
  totalCents?: number;
  createdAt?: string;
}
