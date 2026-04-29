import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser, canViewVehiclePhotos } from "@/lib/auth-utils";
import { VehiclePhotosGridMockup } from "@/components/vehicle-photos-grid-mockup";

export default async function VehicleStatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  const { id: vehicleId } = await params;

  if (!canViewVehiclePhotos(user.role)) {
    redirect("/");
  }

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: {
      id: true,
      plate: true,
      brand: true,
      model: true,
      year: true,
      fuelType: true,
      status: true,
      assignedDriverId: true,
      assignedDriver: { select: { name: true } },
    },
  });

  if (!vehicle) {
    redirect("/");
  }

  // DRIVER can only view assigned vehicles
  if (user.role === "DRIVER" && vehicle.assignedDriverId !== user.id) {
    redirect("/");
  }

  const photos = await prisma.vehiclePhoto.findMany({
    where: { vehicleId, deletedAt: null },
    include: {
      uploadedBy: { select: { name: true } },
    },
    orderBy: [{ template: "asc" }, { uploadedAt: "desc" }],
  });

  const photoHistory = await prisma.vehiclePhoto.findMany({
    where: { vehicleId, deletedAt: { not: null } },
    include: {
      uploadedBy: { select: { name: true } },
    },
    orderBy: [{ template: "asc" }, { deletedAt: "desc" }],
    take: 100,
  });

  const canUpload = user.role === "ADMIN" || user.role === "FLEET_MANAGER" || (user.role === "DRIVER" && vehicle.assignedDriverId === user.id);

  return (
    <div className="space-y-6 pb-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/mezzi" className="hover:text-foreground">Mezzi</Link>
        <span>/</span>
        <Link href={`/mezzi/${vehicleId}`} className="hover:text-foreground">{vehicle.plate}</Link>
        <span>/</span>
        <span>Stato mezzo</span>
      </div>

      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Stato mezzo</h1>
        <div className="flex items-center gap-4 text-sm">
          <div>
            <span className="font-medium">{vehicle.brand} {vehicle.model}</span>
            <span className="text-muted-foreground"> ({vehicle.year})</span>
          </div>
          <div className="text-muted-foreground">
            Targa: <span className="font-mono font-medium">{vehicle.plate}</span>
          </div>
          {vehicle.assignedDriver && (
            <div className="text-muted-foreground">
              Assegnato a: <span className="font-medium">{vehicle.assignedDriver.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main content - Vehicle mockup */}
      <VehiclePhotosGridMockup
        vehicleId={vehicleId}
        photos={photos}
        photoHistory={photoHistory}
        canUpload={canUpload}
        vehicle={vehicle}
      />
    </div>
  );
}
