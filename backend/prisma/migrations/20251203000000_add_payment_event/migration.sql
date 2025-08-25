CREATE TABLE "PaymentEvent" (
  "id" SERIAL PRIMARY KEY,
  "orderId" INTEGER NOT NULL,
  "mp_payment_id" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "raw_payload" JSONB NOT NULL,
  "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "PaymentEvent_mp_payment_id_key" ON "PaymentEvent"("mp_payment_id");
