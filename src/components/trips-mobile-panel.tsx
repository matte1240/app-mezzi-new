"use client";

import { useActionState, useEffect, useState } from "react";
import { startTrip, stopTrip } from "@/lib/actions/trip-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";

export type VehicleTripOption = {
  id: string;
  plate: string;
};

export type OpenTripItem = {
  id: string;
  vehicleId: string;
  vehiclePlate: string;
  startTime: string;
  startKm: number;
};

export function TripsMobilePanel({
  userRole,
  vehicles,
  openTrips,
  lastKmMap,
  initialVehicleId,
}: {
  userRole: string;
  vehicles: VehicleTripOption[];
  openTrips: OpenTripItem[];
  lastKmMap: Record<string, number>;
  initialVehicleId?: string;
}) {
  const router = useRouter();
  const [entryToken] = useState(() =>
    typeof window === "undefined" ? "manual-entry" : window.location.href
  );

  const validInitialVehicleId =
    initialVehicleId && vehicles.some((v) => v.id === initialVehicleId)
      ? initialVehicleId
      : "";

  const [selectedVehicleId, setSelectedVehicleId] = useState(() => {
    if (validInitialVehicleId) return validInitialVehicleId;
    return vehicles[0]?.id || "";
  });

  const [startState, startFormAction] = useActionState(startTrip, undefined);
  const [stopState, stopFormAction] = useActionState(stopTrip, undefined);

  const selectedVehicleLastKm = selectedVehicleId
    ? (lastKmMap[selectedVehicleId] ?? 0)
    : 0;

  const canStart =
    userRole === "DRIVER" || userRole === "FLEET_MANAGER" || userRole === "ADMIN";

  useEffect(() => {
    if (startState?.success || stopState?.success) {
      router.refresh();
    }
  }, [startState?.success, stopState?.success, router]);

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Registro viaggio</h1>
        <p className="text-sm text-muted-foreground">
          Km iniziali, km finali e segnalazione anomalie.
        </p>
      </div>

      {/* ---------- Open trips: closeable individually ---------- */}
      {openTrips.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Viaggi in corso ({openTrips.length})
          </h2>

          {openTrips.map((trip) => {
            const tripLastKm = lastKmMap[trip.vehicleId] ?? trip.startKm;

            return (
              <Card key={trip.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{trip.vehiclePlate}</CardTitle>
                  <CardDescription>
                    Avviato alle{" "}
                    {new Date(trip.startTime).toLocaleTimeString("it-IT", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    · Km partenza: {trip.startKm.toLocaleString("it-IT")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {stopState?.error && (
                    <p className="text-sm text-destructive">{stopState.error}</p>
                  )}
                  {stopState?.success && (
                    <p className="text-sm text-green-700">{stopState.success}</p>
                  )}

                  <form action={stopFormAction} className="space-y-3">
                    <input type="hidden" name="tripId" value={trip.id} />
                    <input type="hidden" name="endQrRaw" value="manual-entry" />

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Km finali *</label>
                      <Input
                        name="endKm"
                        type="number"
                        min={trip.startKm}
                        defaultValue={tripLastKm || trip.startKm}
                        required
                      />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Tipo anomalia</label>
                        <select
                          name="manualAnomalyType"
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        >
                          <option value="">Nessuna</option>
                          <option value="MANUAL">Incidente o danno al mezzo</option>
                          <option value="EXCESSIVE_DISTANCE">Percorso anomalo</option>
                          <option value="LONG_DURATION">Fermo prolungato</option>
                          <option value="KM_INVARIATO">Km invariati</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Foto danni</label>
                        <Input name="anomalyPhotos" type="file" accept="image/*" multiple />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Dettaglio anomalia</label>
                      <Input
                        name="manualAnomalyMessage"
                        placeholder="Descrivi incidente, urto, guasto o altra problematica"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Note viaggio</label>
                      <Input name="notes" placeholder="Eventuali note di chiusura" />
                    </div>

                    <div className="rounded-md border border-orange-200 bg-orange-50 p-2 text-xs text-orange-700">
                      <div className="flex items-start gap-2">
                        <TriangleAlert className="mt-0.5 h-4 w-4" />
                        <p>In caso di danni allega almeno una foto per supportare la segnalazione.</p>
                      </div>
                    </div>

                    <SubmitButton pendingText="Chiusura..." className="w-full">
                      Chiudi viaggio
                    </SubmitButton>
                  </form>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ---------- Start new trip: always visible ---------- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Avvio viaggio</CardTitle>
          <CardDescription>Inserisci i km iniziali e conferma il mezzo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {startState?.error && (
            <p className="text-sm text-destructive">{startState.error}</p>
          )}
          {startState?.success && (
            <p className="text-sm text-green-700">{startState.success}</p>
          )}

          {canStart ? (
            <form action={startFormAction} className="space-y-4">
              <input type="hidden" name="startQrRaw" value={entryToken} />

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Mezzo *</label>
                <select
                  name="vehicleId"
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  required
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plate}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Km iniziali *</label>
                <Input
                  name="startKm"
                  type="number"
                  min={selectedVehicleLastKm || 0}
                  defaultValue={selectedVehicleLastKm || 0}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Note</label>
                <Input name="notes" placeholder="Destinazione, carico, ecc." />
              </div>

              <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                <span>Identificativo ingresso</span>
                <Badge variant="outline">
                  {entryToken !== "manual-entry" ? "Acquisito" : "Manuale"}
                </Badge>
              </div>

              <SubmitButton pendingText="Avvio..." className="w-full">
                Avvia viaggio
              </SubmitButton>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nessun permesso disponibile per avviare viaggi.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
