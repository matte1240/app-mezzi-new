import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { canRecordTrips, getSessionUser } from "@/lib/auth-utils";
import { TripsMobilePanel, type VehicleTripOption, type OpenTripItem } from "@/components/trips-mobile-panel";
import { TripsDesktopList, type TripListItem } from "@/components/trips-desktop-list";

export default async function ViaggiPage({
  searchParams,
}: {
  searchParams: Promise<{ vehicleId?: string }>;
}) {
  const user = await getSessionUser();
  const query = await searchParams;
  const initialVehicleId = query.vehicleId?.trim() || "";
  const isMobileEntry = !!initialVehicleId;

  if (!canRecordTrips(user.role)) {
    redirect("/");
  }

  const vehicleFilter = {};

  if (isMobileEntry) {
    // ---- Mobile / QR flow ----
    const [vehicles, openTrips, lastReadings] = await Promise.all([
      prisma.vehicle.findMany({
        where: { ...vehicleFilter, status: "ACTIVE" },
        orderBy: { plate: "asc" },
        select: { id: true, plate: true },
      }),
      prisma.trip.findMany({
        where: user.role === "DRIVER" ? { driverId: user.id, status: "OPEN" } : { status: "OPEN" },
        orderBy: { startTime: "desc" },
        include: {
          vehicle: { select: { id: true, plate: true } },
        },
      }),
      prisma.mileageReading.findMany({
        where: { vehicle: vehicleFilter },
        orderBy: [{ vehicleId: "asc" }, { km: "desc" }],
        select: { vehicleId: true, km: true },
      }),
    ]);

    const lastKmMap: Record<string, number> = {};
    for (const reading of lastReadings) {
      if (lastKmMap[reading.vehicleId] == null) {
        lastKmMap[reading.vehicleId] = reading.km;
      }
    }

    const vehicleOptions: VehicleTripOption[] = vehicles.map((v) => ({ id: v.id, plate: v.plate }));

    const openTripItems: OpenTripItem[] = openTrips.map((t) => ({
      id: t.id,
      vehicleId: t.vehicleId,
      vehiclePlate: t.vehicle.plate,
      startTime: t.startTime.toISOString(),
      startKm: t.startKm,
    }));

    return (
      <TripsMobilePanel
        userRole={user.role}
        vehicles={vehicleOptions}
        openTrips={openTripItems}
        lastKmMap={lastKmMap}
        initialVehicleId={initialVehicleId}
      />
    );
  }

  // ---- Desktop flow ----
  const allTrips = await prisma.trip.findMany({
    where: { vehicle: vehicleFilter },
    include: {
      vehicle: { select: { plate: true } },
      driver: { select: { name: true } },
      anomalies: {
        select: {
          id: true,
          type: true,
          status: true,
          message: true,
          isManual: true,
          _count: { select: { photos: true } },
        },
      },
    },
    orderBy: { startTime: "desc" },
    take: 500,
  });

  const tripItems: TripListItem[] = allTrips.map((t) => ({
    id: t.id,
    vehiclePlate: t.vehicle.plate,
    driverName: t.driver.name ?? "—",
    status: t.status,
    startTime: t.startTime.toISOString(),
    endTime: t.endTime?.toISOString() ?? null,
    startKm: t.startKm,
    endKm: t.endKm,
    notes: t.notes,
    anomalies: t.anomalies.map((a) => ({
      id: a.id,
      type: a.type,
      status: a.status,
      message: a.message,
      isManual: a.isManual,
      photoCount: a._count.photos,
    })),
  }));

  return <TripsDesktopList trips={tripItems} />;
}
