-- Overdue fines: 1 KES per day (active policies + DB default for new rows)
UPDATE "fine_configurations"
SET "dailyRate" = 1.0
WHERE "isActive" = true;

ALTER TABLE "fine_configurations" ALTER COLUMN "dailyRate" SET DEFAULT 1.0;
