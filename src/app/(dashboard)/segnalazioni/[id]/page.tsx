import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Camera, Car, Clock3, Route, UserRound, Wrench } from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  getSessionUser,
  canViewTripAnomalies,
  canManageTripAnomalies,
} from "@/lib/auth-utils";
import {
  tripAnomalyTypeLabels,
  tripAnomalyStatusLabels,
  tripAnomalyStatusColors,
} from "@/lib/labels";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TripAnomalyStatusForm } from "@/components/trip-anomaly-status-form";

function formatDateTime(value: Date) {
  return `${value.toLocaleDateString("it-IT")} ${value.toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function canPreviewImage(mimeType: string) {
  return mimeType.toLowerCase().startsWith("image/");
}

type AnomalyDetailPayload = {
  id: string;
  type: string;
  status: "OPEN" | "IN_REVIEW" | "RESOLVED";
  message: string;
  isManual: boolean;
  resolutionNotes: string | null;
  resolvedAt: Date | null;
  trip: {
    driverId: string;
    startTime: Date;
    endTime: Date | null;
    startKm: number;
    endKm: number | null;
    vehicle: {
      plate: string;
    };
    driver: {
      name: string | null;
    };
  };
  createdAt: Date;
  createdBy: {
    id: string;
    name: string | null;
  };
  resolvedBy: {
    id: string;
    name: string | null;
  } | null;
  photos: Array<{
    id: string;
    name: string;
    mimeType: string;
    sizeBytes: number;
    createdAt: Date;
  }>;
};

export default async function SegnalazioneDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!canViewTripAnomalies(user.role)) {
    redirect("/");
  }

  const { id } = await params;

  const anomalyResult = await prisma.tripAnomaly.findUnique({
    where: { id },
    include: {
      trip: {
        include: {
          vehicle: true,
          driver: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
      resolvedBy: {
        select: {
          id: true,
          name: true,
        },
      },
      photos: {
        select: {
          id: true,
          name: true,
          mimeType: true,
          sizeBytes: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const anomaly = anomalyResult as unknown as AnomalyDetailPayload | null;

  if (!anomaly) {
    notFound();
  }

  if (user.role === "DRIVER" && anomaly.trip.driverId !== user.id) {
    redirect("/segnalazioni");
  }

  const canManage = canManageTripAnomalies(user.role);
  const distanceKm =
    anomaly.trip.endKm != null ? anomaly.trip.endKm - anomaly.trip.startKm : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dettaglio segnalazione</h1>
          <p className="text-sm text-muted-foreground">
            {tripAnomalyTypeLabels[anomaly.type] || anomaly.type} · {anomaly.trip.vehicle.plate}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/segnalazioni">
            <Button type="button" variant="outline" size="sm">Torna alle segnalazioni</Button>
          </Link>
          <Link href="/viaggi">
            <Button type="button" variant="outline" size="sm">Apri viaggi</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Wrench className="h-4 w-4" />
                Dati segnalazione
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">
                  {tripAnomalyTypeLabels[anomaly.type] || anomaly.type}
                </Badge>
                <Badge className={tripAnomalyStatusColors[anomaly.status] || ""}>
                  {tripAnomalyStatusLabels[anomaly.status] || anomaly.status}
                </Badge>
                {anomaly.isManual ? (
                  <Badge variant="outline">Inserita manualmente</Badge>
                ) : (
                  <Badge variant="outline">Rilevata automaticamente</Badge>
                )}
              </div>

              <p className="rounded-md border bg-muted/20 p-3 text-sm leading-relaxed">
                {anomaly.message}
              </p>

              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock3 className="h-4 w-4" />
                  Segnalata il {formatDateTime(anomaly.createdAt)}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <UserRound className="h-4 w-4" />
                  Da {anomaly.createdBy.name || "Utente"}
                </div>
                {anomaly.resolvedAt ? (
                  <div className="flex items-center gap-2 text-muted-foreground sm:col-span-2">
                    <Clock3 className="h-4 w-4" />
                    Risolta il {formatDateTime(anomaly.resolvedAt)}
                    {anomaly.resolvedBy?.name ? ` da ${anomaly.resolvedBy.name}` : ""}
                  </div>
                ) : null}
              </div>

              {anomaly.resolutionNotes ? (
                <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                  <p className="font-medium">Note operative</p>
                  <p className="mt-1">{anomaly.resolutionNotes}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Route className="h-4 w-4" />
                Contesto viaggio
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Car className="h-4 w-4" />
                Mezzo: {anomaly.trip.vehicle.plate}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <UserRound className="h-4 w-4" />
                Autista: {anomaly.trip.driver.name || "—"}
              </div>
              <div className="text-muted-foreground">
                Inizio: {formatDateTime(anomaly.trip.startTime)} · Km {anomaly.trip.startKm.toLocaleString("it-IT")}
              </div>
              <div className="text-muted-foreground">
                Fine: {anomaly.trip.endTime ? formatDateTime(anomaly.trip.endTime) : "Viaggio aperto"}
                {anomaly.trip.endKm != null
                  ? ` · Km ${anomaly.trip.endKm.toLocaleString("it-IT")}`
                  : ""}
              </div>
              <div className="text-muted-foreground sm:col-span-2">
                Distanza: {distanceKm != null ? `${distanceKm.toLocaleString("it-IT")} km` : "Non disponibile"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Camera className="h-4 w-4" />
                Foto segnalazione ({anomaly.photos.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {anomaly.photos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nessuna foto allegata.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {anomaly.photos.map((photo) => (
                    <a
                      key={photo.id}
                      href={`/api/documents/${photo.id}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="overflow-hidden rounded-lg border bg-card transition-colors hover:bg-muted/30"
                    >
                      <div className="relative aspect-video w-full bg-muted/40">
                        {canPreviewImage(photo.mimeType) ? (
                          <Image
                            src={`/api/documents/${photo.id}/download?variant=thumb`}
                            alt={photo.name}
                            fill
                            unoptimized
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 40vw"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center px-3 text-center text-xs text-muted-foreground">
                            Anteprima non disponibile per questo formato
                          </div>
                        )}
                      </div>
                      <div className="space-y-1 p-3 text-xs text-muted-foreground">
                        <p className="truncate text-sm font-medium text-foreground">{photo.name}</p>
                        <p>
                          {formatBytes(photo.sizeBytes)} · {formatDateTime(photo.createdAt)}
                        </p>
                        <p>{photo.mimeType}</p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Workflow stato</CardTitle>
            </CardHeader>
            <CardContent>
              {canManage ? (
                <TripAnomalyStatusForm
                  anomalyId={anomaly.id}
                  currentStatus={anomaly.status}
                  initialResolutionNotes={anomaly.resolutionNotes}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Solo amministratori e fleet manager possono aggiornare lo stato.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
