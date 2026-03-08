import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-utils";
import { ChilometraggiList, type MileageItem, type VehicleOption } from "@/components/chilometraggi-list";

export default async function ChilometraggiPage() {
  const user = await getSessionUser();

  const whereVehicle =
    user.role === "DRIVER" ? { assignedDriverId: user.id } : {};

  const [readings, vehicles] = await Promise.all([
    prisma.mileageReading.findMany({
      where: { vehicle: whereVehicle },
      include: { vehicle: true, recordedBy: true },
      orderBy: { date: "desc" },
      take: 500,
    }),
    prisma.vehicle.findMany({
      where: { ...whereVehicle, status: "ACTIVE" },
      select: { id: true, plate: true },
      orderBy: { plate: "asc" },
    }),
  ]);

  // Fetch latest km per vehicle for form validation
  const lastKmMap: Record<string, number> = {};
  for (const v of vehicles) {
    const last = await prisma.mileageReading.findFirst({
      where: { vehicleId: v.id },
      orderBy: { km: "desc" },
      select: { km: true },
    });
    if (last) lastKmMap[v.id] = last.km;
  }

  const items: MileageItem[] = readings.map((r) => ({
    id: r.id,
    date: r.date.toISOString(),
    km: r.km,
    source: r.source,
    notes: r.notes,
    vehicleId: r.vehicleId,
    vehiclePlate: r.vehicle.plate,
    recordedByName: r.recordedBy.name,
  }));

  const vehicleOptions: VehicleOption[] = vehicles.map((v) => ({
    id: v.id,
    plate: v.plate,
  }));

  return <ChilometraggiList readings={items} vehicles={vehicleOptions} lastKmMap={lastKmMap} />;
}
