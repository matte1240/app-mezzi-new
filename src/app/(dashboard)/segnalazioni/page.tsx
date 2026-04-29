import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  canCreateTripAnomalies,
  canViewTripAnomalies,
  getSessionUser,
  isAdmin,
} from "@/lib/auth-utils";
import {
  TripAnomaliesList,
  type TripAnomalyListItem,
  type TripAnomalyTripOption,
} from "@/components/trip-anomalies-list";

export default async function SegnalazioniPage() {
  const user = await getSessionUser();

  if (!canViewTripAnomalies(user.role)) {
    redirect("/");
  }

  const where =
    user.role === "DRIVER"
      ? { trip: { driverId: user.id } }
      : {};

  const tripWhere =
    user.role === "DRIVER"
      ? { driverId: user.id }
      : {};

  const [anomalies, trips] = await Promise.all([
    prisma.tripAnomaly.findMany({
      where,
      include: {
        trip: {
          select: {
            id: true,
            vehicleId: true,
            vehicle: { select: { plate: true } },
            driver: { select: { name: true } },
          },
        },
        createdBy: { select: { name: true } },
        _count: { select: { photos: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    prisma.trip.findMany({
      where: tripWhere,
      select: {
        id: true,
        status: true,
        startTime: true,
        vehicle: { select: { plate: true } },
      },
      orderBy: { startTime: "desc" },
      take: 500,
    }),
  ]);

  const items: TripAnomalyListItem[] = anomalies.map((item) => ({
    id: item.id,
    tripId: item.trip.id,
    vehicleId: item.trip.vehicleId,
    vehiclePlate: item.trip.vehicle.plate,
    driverName: item.trip.driver.name || "—",
    type: item.type,
    status: item.status,
    message: item.message,
    isManual: item.isManual,
    createdAt: item.createdAt.toISOString(),
    createdByName: item.createdBy.name || "—",
    resolutionNotes: item.resolutionNotes,
    photoCount: item._count.photos,
  }));

  const tripOptions: TripAnomalyTripOption[] = trips.map((trip) => ({
    id: trip.id,
    vehiclePlate: trip.vehicle.plate,
    status: trip.status,
    startTime: trip.startTime.toISOString(),
  }));

  return (
    <TripAnomaliesList
      anomalies={items}
      trips={tripOptions}
      canCreate={canCreateTripAnomalies(user.role)}
      canEditDelete={isAdmin(user.role)}
    />
  );
}
