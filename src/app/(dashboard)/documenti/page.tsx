import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-utils";
import { DocumentiList, type DocItem } from "@/components/documenti-list";

export default async function DocumentiPage() {
  const user = await getSessionUser();

  const whereVehicle =
    user.role === "DRIVER" ? { assignedDriverId: user.id } : {};

  const documents = await prisma.document.findMany({
    where: { vehicle: whereVehicle },
    include: { vehicle: true, uploadedBy: true },
    orderBy: [{ vehicle: { plate: "asc" } }, { createdAt: "desc" }],
    take: 500,
  });

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

  return <DocumentiList documents={items} />;
}
