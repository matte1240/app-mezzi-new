ALTER TABLE "MaintenanceIntervention"
ADD COLUMN "sourceTripAnomalyId" TEXT;

ALTER TABLE "PlannedMaintenance"
ADD COLUMN "sourceDeadlineId" TEXT,
ADD COLUMN "sourceTripAnomalyId" TEXT;

CREATE INDEX "MaintenanceIntervention_sourceTripAnomalyId_idx"
ON "MaintenanceIntervention"("sourceTripAnomalyId");

CREATE INDEX "PlannedMaintenance_sourceDeadlineId_idx"
ON "PlannedMaintenance"("sourceDeadlineId");

CREATE INDEX "PlannedMaintenance_sourceTripAnomalyId_idx"
ON "PlannedMaintenance"("sourceTripAnomalyId");

ALTER TABLE "MaintenanceIntervention"
ADD CONSTRAINT "MaintenanceIntervention_sourceTripAnomalyId_fkey"
FOREIGN KEY ("sourceTripAnomalyId") REFERENCES "TripAnomaly"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "PlannedMaintenance"
ADD CONSTRAINT "PlannedMaintenance_sourceDeadlineId_fkey"
FOREIGN KEY ("sourceDeadlineId") REFERENCES "Deadline"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "PlannedMaintenance"
ADD CONSTRAINT "PlannedMaintenance_sourceTripAnomalyId_fkey"
FOREIGN KEY ("sourceTripAnomalyId") REFERENCES "TripAnomaly"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
