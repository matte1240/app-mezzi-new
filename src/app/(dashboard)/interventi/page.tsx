import { prisma } from "@/lib/prisma";
import { getSessionUser, canManageDeadlines } from "@/lib/auth-utils";
import { InterventiList, type InterventoItem, type PlannedItem, type VehicleOption } from "@/components/interventi-list";

export default async function InterventiPage() {
  const user = await getSessionUser();

  const whereVehicle =
    user.role === "DRIVER" ? { assignedDriverId: user.id } : {};

  const [interventions, planned, vehicles] = await Promise.all([
    prisma.maintenanceIntervention.findMany({
      where: { vehicle: whereVehicle },
      include: { vehicle: true, user: true },
      orderBy: { date: "desc" },
      take: 500,
    }),
    prisma.plannedMaintenance.findMany({
      where: { vehicle: whereVehicle },
      include: { vehicle: true, createdBy: true },
      orderBy: { scheduledDate: "asc" },
      take: 500,
    }),
    prisma.vehicle.findMany({
      where: { ...whereVehicle, status: "ACTIVE" },
      select: { id: true, plate: true },
      orderBy: { plate: "asc" },
    }),
  ]);

  const items: InterventoItem[] = interventions.map((m) => ({
    id: m.id,
    date: m.date.toISOString(),
    km: m.km,
    type: m.type,
    costEur: m.costEur ? String(m.costEur) : null,
    garage: m.garage,
    description: m.description,
    vehicleId: m.vehicleId,
    vehiclePlate: m.vehicle.plate,
    userName: m.user.name,
  }));

  // Latest km per vehicle (for both forms)
  const lastKmMap: Record<string, number> = {};
  const allVehicleIds = new Set([
    ...vehicles.map((v) => v.id),
    ...planned.map((p) => p.vehicleId),
  ]);
  for (const vid of allVehicleIds) {
    const last = await prisma.mileageReading.findFirst({
      where: { vehicleId: vid },
      orderBy: { km: "desc" },
      select: { km: true },
    });
    if (last) lastKmMap[vid] = last.km;
  }

  const plannedItems: PlannedItem[] = planned.map((p) => ({
    id: p.id,
    vehicleId: p.vehicleId,
    vehiclePlate: p.vehicle.plate,
    vehicleCurrentKm: lastKmMap[p.vehicleId] ?? 0,
    type: p.type,
    scheduledDate: p.scheduledDate.toISOString(),
    description: p.description,
    garage: p.garage,
    notes: p.notes,
    status: p.status,
    createdByName: p.createdBy.name,
  }));

  const vehicleOptions: VehicleOption[] = vehicles.map((v) => ({
    id: v.id,
    plate: v.plate,
  }));

  return (
    <InterventiList
      interventions={items}
      vehicles={vehicleOptions}
      lastKmMap={lastKmMap}
      plannedItems={plannedItems}
      canManagePlanned={canManageDeadlines(user.role)}
    />
  );
}
