-- CreateEnum
CREATE TYPE "TripAnomalyStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'RESOLVED');

-- AlterTable
ALTER TABLE "TripAnomaly"
ADD COLUMN "status" "TripAnomalyStatus" NOT NULL DEFAULT 'OPEN',
ADD COLUMN "resolvedByUserId" TEXT,
ADD COLUMN "resolutionNotes" TEXT,
ADD COLUMN "resolvedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Document"
ADD COLUMN "tripAnomalyId" TEXT;

-- Backfill anomaly-photo relation from legacy notes format:
-- "Foto anomalia viaggio {tripId} ({anomalyId})"
UPDATE "Document" d
SET "tripAnomalyId" = substring(d."notes" FROM '\\(([^)]+)\\)$')
WHERE d."tripAnomalyId" IS NULL
  AND d."notes" IS NOT NULL
  AND d."notes" LIKE 'Foto anomalia viaggio %(%'
  AND EXISTS (
    SELECT 1
    FROM "TripAnomaly" ta
    WHERE ta."id" = substring(d."notes" FROM '\\(([^)]+)\\)$')
  );

-- CreateIndex
CREATE INDEX "TripAnomaly_status_createdAt_idx" ON "TripAnomaly"("status", "createdAt");

-- CreateIndex
CREATE INDEX "TripAnomaly_resolvedByUserId_idx" ON "TripAnomaly"("resolvedByUserId");

-- CreateIndex
CREATE INDEX "Document_tripAnomalyId_idx" ON "Document"("tripAnomalyId");

-- AddForeignKey
ALTER TABLE "TripAnomaly"
ADD CONSTRAINT "TripAnomaly_resolvedByUserId_fkey"
FOREIGN KEY ("resolvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document"
ADD CONSTRAINT "Document_tripAnomalyId_fkey"
FOREIGN KEY ("tripAnomalyId") REFERENCES "TripAnomaly"("id") ON DELETE SET NULL ON UPDATE CASCADE;
