-- CreateEnum
CREATE TYPE "VehiclePhotoTemplate" AS ENUM ('FRONTE', 'RETRO', 'LATERALE_SX', 'LATERALE_DX', 'CRUSCOTTO');

-- CreateTable
CREATE TABLE "VehiclePhoto" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "template" "VehiclePhotoTemplate" NOT NULL,
    "filePath" TEXT NOT NULL,
    "uploadedByUserId" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "VehiclePhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VehiclePhoto_vehicleId_idx" ON "VehiclePhoto"("vehicleId");

-- CreateIndex
CREATE INDEX "VehiclePhoto_template_idx" ON "VehiclePhoto"("template");

-- CreateIndex
CREATE INDEX "VehiclePhoto_uploadedByUserId_idx" ON "VehiclePhoto"("uploadedByUserId");

-- CreateIndex
CREATE INDEX "VehiclePhoto_deletedAt_idx" ON "VehiclePhoto"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "VehiclePhoto_vehicleId_template_deletedAt_key" ON "VehiclePhoto"("vehicleId", "template", "deletedAt");

-- AddForeignKey
ALTER TABLE "VehiclePhoto" ADD CONSTRAINT "VehiclePhoto_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehiclePhoto" ADD CONSTRAINT "VehiclePhoto_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
