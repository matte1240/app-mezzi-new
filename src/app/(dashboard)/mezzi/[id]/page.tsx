import { prisma } from "@/lib/prisma";
import { getSessionUser, canManageDeadlines, canUploadDocuments, isAdmin } from "@/lib/auth-utils";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Pencil } from "lucide-react";
import { ownershipLabels, statusLabels, fuelLabels, statusColors } from "@/lib/labels";
import { MileageTab } from "@/components/vehicles/mileage-tab";
import { RefuelingTab } from "@/components/vehicles/refueling-tab";
import { MaintenanceTab } from "@/components/vehicles/maintenance-tab";
import { DeadlineTab } from "@/components/vehicles/deadline-tab";
import { DocumentTab } from "@/components/vehicles/document-tab";
import { DeleteVehicleButton } from "@/components/vehicles/delete-vehicle-button";
import { VehicleQrCard } from "@/components/vehicles/vehicle-qr-card";

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  const { id } = await params;

  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      assignedDriver: true,
      mileageReadings: { orderBy: { date: "desc" }, take: 20 },
      refuelings: { orderBy: { date: "desc" }, take: 20, include: { user: true } },
      maintenanceInterventions: { orderBy: { date: "desc" }, take: 20, include: { user: true } },
      deadlines: { orderBy: { dueDate: "asc" } },
      documents: {
        orderBy: { createdAt: "desc" },
        include: {
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
      },
    },
  });

  if (!vehicle) notFound();

  // Driver can only see assigned vehicles
  if (user.role === "DRIVER" && vehicle.assignedDriverId !== user.id) {
    notFound();
  }

  const canCreateDeadlines = canManageDeadlines(user.role);
  const canUpload = canUploadDocuments(user.role);
  const canEditDelete = isAdmin(user.role);

  const lastKm = vehicle.mileageReadings[0]?.km || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/mezzi">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-mono">{vehicle.plate}</h1>
              <Badge variant="outline" className={statusColors[vehicle.status]}>
                {statusLabels[vehicle.status]}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {vehicle.brand} {vehicle.model} ({vehicle.year}) — {fuelLabels[vehicle.fuelType]} — {ownershipLabels[vehicle.ownershipType]}
            </p>
          </div>
        </div>
        {canEditDelete && (
          <div className="flex gap-2">
            <Link href={`/mezzi/${id}/modifica`}>
              <Button variant="outline" size="sm">
                <Pencil className="mr-2 h-4 w-4" />
                Modifica
              </Button>
            </Link>
            <DeleteVehicleButton vehicleId={id} plate={vehicle.plate} />
          </div>
        )}
      </div>

      {/* Info cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ultimo Km
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{lastKm.toLocaleString("it-IT")} km</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Autista Assegnato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">
              {vehicle.assignedDriver?.name || "Pool (non assegnato)"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Immatricolazione
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">
              {vehicle.registrationDate
                ? new Date(vehicle.registrationDate).toLocaleDateString("it-IT")
                : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              VIN / Telaio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-mono">{vehicle.vin || "—"}</p>
          </CardContent>
        </Card>
        <VehicleQrCard vehicleId={vehicle.id} plate={vehicle.plate} />
      </div>

      {vehicle.notes && (
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">{vehicle.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="km">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="km">Chilometraggi</TabsTrigger>
          <TabsTrigger value="refueling">Rifornimenti</TabsTrigger>
          <TabsTrigger value="maintenance">Interventi</TabsTrigger>
          <TabsTrigger value="deadlines">
            Scadenze
            {vehicle.deadlines.filter((d) => !d.completed && d.dueDate < new Date()).length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs justify-center">
                {vehicle.deadlines.filter((d) => !d.completed && d.dueDate < new Date()).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="documents">Documenti</TabsTrigger>
        </TabsList>

        <TabsContent value="km" className="mt-4">
          <MileageTab
            vehicleId={vehicle.id}
            lastKm={lastKm}
            canEditDelete={canEditDelete}
            readings={vehicle.mileageReadings.map((r) => ({
              ...r,
              date: r.date.toISOString(),
              createdAt: r.createdAt.toISOString(),
            }))}
          />
        </TabsContent>

        <TabsContent value="refueling" className="mt-4">
          <RefuelingTab
            vehicleId={vehicle.id}
            vehicleFuelType={vehicle.fuelType}
            lastKm={lastKm}
            canEditDelete={canEditDelete}
            refuelings={vehicle.refuelings.map((r) => ({
              ...r,
              date: r.date.toISOString(),
              createdAt: r.createdAt.toISOString(),
              liters: Number(r.liters),
              costEur: Number(r.costEur),
              userName: r.user.name,
            }))}
          />
        </TabsContent>

        <TabsContent value="maintenance" className="mt-4">
          <MaintenanceTab
            vehicleId={vehicle.id}
            lastKm={lastKm}
            canEditDelete={canEditDelete}
            interventions={vehicle.maintenanceInterventions.map((m) => ({
              ...m,
              date: m.date.toISOString(),
              createdAt: m.createdAt.toISOString(),
              costEur: m.costEur ? Number(m.costEur) : null,
              userName: m.user.name,
            }))}
          />
        </TabsContent>

        <TabsContent value="deadlines" className="mt-4">
          <DeadlineTab
            vehicleId={vehicle.id}
            deadlines={vehicle.deadlines.map((d) => ({
              ...d,
              dueDate: d.dueDate.toISOString(),
              completedDate: d.completedDate?.toISOString() || null,
              createdAt: d.createdAt.toISOString(),
              updatedAt: d.updatedAt.toISOString(),
            }))}
            currentKm={lastKm}
            canCreate={canCreateDeadlines}
            canEditDelete={canEditDelete}
          />
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <DocumentTab
            vehicleId={vehicle.id}
            documents={vehicle.documents.map((d) => ({
              ...d,
              createdAt: d.createdAt.toISOString(),
              validFrom: d.validFrom?.toISOString() || null,
              validTo: d.validTo?.toISOString() || null,
              uploadedByName: d.uploadedBy.name,
              tripAnomalyType: d.tripAnomaly?.type ?? null,
              tripAnomalyStatus: d.tripAnomaly?.status ?? null,
              tripId: d.tripAnomaly?.tripId ?? null,
            }))}
            canUpload={canUpload}
            canEditDelete={canEditDelete}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
