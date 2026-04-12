-- Ensure only one OPEN trip can exist per vehicle/driver at the same time.
CREATE UNIQUE INDEX IF NOT EXISTS "Trip_one_open_per_vehicle_idx"
ON "Trip" ("vehicleId")
WHERE "status" = 'OPEN';

CREATE UNIQUE INDEX IF NOT EXISTS "Trip_one_open_per_driver_idx"
ON "Trip" ("driverId")
WHERE "status" = 'OPEN';
