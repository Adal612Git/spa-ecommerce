-- Rename existing orders with status APPROVED to CONFIRMED
UPDATE "public"."Order" SET "status" = 'CONFIRMED' WHERE "status" = 'APPROVED';
