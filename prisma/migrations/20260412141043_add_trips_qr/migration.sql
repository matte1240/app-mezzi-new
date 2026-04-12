-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('OPEN', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "TripAnomalyType" AS ENUM ('LONG_DURATION', 'EXCESSIVE_DISTANCE', 'HIGH_AVERAGE_SPEED', 'KM_INVARIATO', 'MANUAL');

-- AlterEnum
ALTER TYPE "MileageSource" ADD VALUE 'TRIP';

-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "status" "TripStatus" NOT NULL DEFAULT 'OPEN',
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "startKm" INTEGER NOT NULL,
    "endKm" INTEGER,
    "startQrRaw" TEXT NOT NULL,
    "endQrRaw" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripAnomaly" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "type" "TripAnomalyType" NOT NULL,
    "message" TEXT NOT NULL,
    "isManual" BOOLEAN NOT NULL DEFAULT false,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripAnomaly_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Trip_vehicleId_startTime_idx" ON "Trip"("vehicleId", "startTime");

-- CreateIndex
CREATE INDEX "Trip_driverId_startTime_idx" ON "Trip"("driverId", "startTime");

-- CreateIndex
CREATE INDEX "Trip_status_startTime_idx" ON "Trip"("status", "startTime");

-- CreateIndex
CREATE INDEX "TripAnomaly_tripId_idx" ON "TripAnomaly"("tripId");

-- CreateIndex
CREATE INDEX "TripAnomaly_type_createdAt_idx" ON "TripAnomaly"("type", "createdAt");

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripAnomaly" ADD CONSTRAINT "TripAnomaly_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripAnomaly" ADD CONSTRAINT "TripAnomaly_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
