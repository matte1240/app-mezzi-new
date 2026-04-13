import { prisma } from "@/lib/prisma";
import { getSessionUser, canUploadDocuments, isAdmin } from "@/lib/auth-utils";
import { DocumentiList, type DocItem, type VehicleOption } from "@/components/documenti-list";

type DocumentWithAnomaly = {
  id: string;
  name: string;
  type: string;
  sizeBytes: number;
  notes: string | null;
  createdAt: Date;
  validFrom: Date | null;
  validTo: Date | null;
  vehicleId: string;
  vehicle: {
    plate: string;
    brand: string;
    model: string;
  };
  uploadedBy: {
    name: string;
  };
  tripAnomalyId?: string | null;
  tripAnomaly?: {
    id: string;
    type: string;
    status: string;
    tripId: string;
  } | null;
};

export default async function DocumentiPage() {
  const user = await getSessionUser();
  const canUpload = canUploadDocuments(user.role);
  const canEditDelete = isAdmin(user.role);

  const whereVehicle =
    user.role === "DRIVER" ? { assignedDriverId: user.id } : {};

  const [documents, vehicles] = await Promise.all([
    prisma.document.findMany({
      where: { vehicle: whereVehicle },
      include: {
        vehicle: true,
        uploadedBy: true,
        tripAnomaly: {
          select: {
            id: true,
            type: true,
            status: true,
            tripId: true,
          },
        },
      },
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

  const typedDocuments = documents as unknown as DocumentWithAnomaly[];

  const items: DocItem[] = typedDocuments.map((d) => ({
    id: d.id,
    name: d.name,
    type: d.type,
    sizeBytes: d.sizeBytes,
    notes: d.notes,
    createdAt: d.createdAt.toISOString(),
    validFrom: d.validFrom ? d.validFrom.toISOString() : null,
    validTo: d.validTo ? d.validTo.toISOString() : null,
    vehicleId: d.vehicleId,
    vehiclePlate: d.vehicle.plate,
    vehicleBrand: d.vehicle.brand,
    vehicleModel: d.vehicle.model,
    uploadedByName: d.uploadedBy.name,
    tripAnomalyId: d.tripAnomalyId ?? null,
    tripAnomalyType: d.tripAnomaly?.type ?? null,
    tripAnomalyStatus: d.tripAnomaly?.status ?? null,
    tripId: d.tripAnomaly?.tripId ?? null,
  }));

  const vehicleOptions: VehicleOption[] = vehicles.map((v) => ({
    id: v.id,
    plate: v.plate,
  }));

  return <DocumentiList documents={items} vehicles={vehicleOptions} canUpload={canUpload} canEditDelete={canEditDelete} />;
}
