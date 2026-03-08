import { prisma } from "@/lib/prisma";
import { getSessionUser, canUploadDocuments } from "@/lib/auth-utils";
import { DocumentiList, type DocItem, type VehicleOption } from "@/components/documenti-list";

export default async function DocumentiPage() {
  const user = await getSessionUser();
  const canUpload = canUploadDocuments(user.role);

  const whereVehicle =
    user.role === "DRIVER" ? { assignedDriverId: user.id } : {};

  const [documents, vehicles] = await Promise.all([
    prisma.document.findMany({
      where: { vehicle: whereVehicle },
      include: { vehicle: true, uploadedBy: true },
      orderBy: [{ vehicle: { plate: "asc" } }, { createdAt: "desc" }],
      take: 500,
    }),
    canUpload
      ? prisma.vehicle.findMany({
          where: { ...whereVehicle, status: "ACTIVE" },
          select: { id: true, plate: true },
          orderBy: { plate: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const items: DocItem[] = documents.map((d) => ({
    id: d.id,
    name: d.name,
    type: d.type,
    sizeBytes: d.sizeBytes,
    createdAt: d.createdAt.toISOString(),
    vehicleId: d.vehicleId,
    vehiclePlate: d.vehicle.plate,
    vehicleBrand: d.vehicle.brand,
    vehicleModel: d.vehicle.model,
    uploadedByName: d.uploadedBy.name,
  }));

  const vehicleOptions: VehicleOption[] = vehicles.map((v) => ({
    id: v.id,
    plate: v.plate,
  }));

  return <DocumentiList documents={items} vehicles={vehicleOptions} canUpload={canUpload} />;
}
