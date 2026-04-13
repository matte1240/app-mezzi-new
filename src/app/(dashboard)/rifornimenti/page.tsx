import { prisma } from "@/lib/prisma";
import { getSessionUser, isAdmin } from "@/lib/auth-utils";
import { RifornimentiList, type RifornimentoItem, type VehicleOptionFuel } from "@/components/rifornimenti-list";

export default async function RifornimentiPage() {
  const user = await getSessionUser();

  const whereVehicle =
    user.role === "DRIVER" ? { assignedDriverId: user.id } : {};

  const [refuelings, vehicles] = await Promise.all([
    prisma.refueling.findMany({
      where: { vehicle: whereVehicle },
      include: { vehicle: true, user: true },
      orderBy: { date: "desc" },
      take: 500,
    }),
    prisma.vehicle.findMany({
      where: { ...whereVehicle, status: "ACTIVE" },
      select: { id: true, plate: true, fuelType: true },
      orderBy: { plate: "asc" },
    }),
  ]);

  const items: RifornimentoItem[] = refuelings.map((r) => ({
    id: r.id,
    date: r.date.toISOString(),
    km: r.km,
    liters: String(r.liters),
    costEur: String(r.costEur),
    fullTank: r.fullTank,
    fuelType: r.fuelType,
    station: r.station,
    notes: r.notes,
    vehicleId: r.vehicleId,
    vehiclePlate: r.vehicle.plate,
    userName: r.user.name,
  }));

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

  const vehicleOptions: VehicleOptionFuel[] = vehicles.map((v) => ({
    id: v.id,
    plate: v.plate,
    fuelType: v.fuelType,
  }));

  return <RifornimentiList refuelings={items} vehicles={vehicleOptions} lastKmMap={lastKmMap} canEditDelete={isAdmin(user.role)} />;
}
