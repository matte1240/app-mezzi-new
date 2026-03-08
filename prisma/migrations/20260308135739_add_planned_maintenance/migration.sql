-- CreateEnum
CREATE TYPE "PlannedMaintenanceStatus" AS ENUM ('PLANNED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "PlannedMaintenance" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "type" "MaintenanceType" NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "garage" TEXT,
    "notes" TEXT,
    "status" "PlannedMaintenanceStatus" NOT NULL DEFAULT 'PLANNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlannedMaintenance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlannedMaintenance_vehicleId_idx" ON "PlannedMaintenance"("vehicleId");

-- CreateIndex
CREATE INDEX "PlannedMaintenance_scheduledDate_idx" ON "PlannedMaintenance"("scheduledDate");

-- CreateIndex
CREATE INDEX "PlannedMaintenance_status_scheduledDate_idx" ON "PlannedMaintenance"("status", "scheduledDate");

-- AddForeignKey
ALTER TABLE "PlannedMaintenance" ADD CONSTRAINT "PlannedMaintenance_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedMaintenance" ADD CONSTRAINT "PlannedMaintenance_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
