"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search } from "lucide-react";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  tripStatusLabels,
} from "@/lib/labels";
import { deleteTrip, updateTrip } from "@/lib/actions/trip-actions";
import { useRouter } from "next/navigation";

export type TripListItem = {
  id: string;
  vehiclePlate: string;
  driverName: string;
  status: string;
  startTime: string;
  endTime: string | null;
  startKm: number;
  endKm: number | null;
  notes: string | null;
};

const tripStatusColors: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  ABANDONED: "bg-gray-100 text-gray-800",
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }) + " " + d.toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toDateTimeLocal(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  const timezoneOffset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - timezoneOffset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}

export function TripsDesktopList({ trips, canEditDelete = false }: { trips: TripListItem[]; canEditDelete?: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [editingId, setEditingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = trips;

    if (statusFilter !== "ALL") {
      result = result.filter((t) => t.status === statusFilter);
    }

    const q = query.toLowerCase().trim();
    if (q) {
      result = result.filter((t) => {
        const hay = [
          t.vehiclePlate,
          t.driverName,
          t.notes ?? "",
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }

    return result;
  }, [trips, query, statusFilter]);

  const openCount = trips.filter((t) => t.status === "OPEN").length;
  const completedCount = trips.filter((t) => t.status === "COMPLETED").length;

  async function handleDelete(tripId: string) {
    if (!confirm("Eliminare definitivamente questo viaggio?")) {
      return;
    }

    const result = await deleteTrip(tripId);
    if (result?.error) {
      alert(result.error);
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Viaggi</h1>
          <p className="text-sm text-muted-foreground">
            Registro completo dei viaggi della flotta
          </p>
        </div>
        <Link
          href="/viaggi?vehicleId=manual-entry"
          className="inline-flex h-8 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Crea viaggio
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In corso</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{openCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completati</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{completedCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cerca per targa, autista, note..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-md border bg-background py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="ALL">Tutti gli stati</option>
          <option value="OPEN">In corso</option>
          <option value="COMPLETED">Completati</option>
          <option value="ABANDONED">Interrotti</option>
        </select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mezzo</TableHead>
                <TableHead>Autista</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Inizio</TableHead>
                <TableHead>Fine</TableHead>
                <TableHead className="text-right">Km</TableHead>
                <TableHead>Note</TableHead>
                {canEditDelete ? <TableHead className="text-right">Azioni</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canEditDelete ? 8 : 7} className="py-8 text-center text-sm text-muted-foreground">
                    Nessun viaggio trovato
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((trip) => {
                  if (editingId === trip.id) {
                    return (
                      <TripEditRow
                        key={trip.id}
                        trip={trip}
                        colSpan={canEditDelete ? 8 : 7}
                        onCancel={() => setEditingId(null)}
                      />
                    );
                  }

                  const distance =
                    trip.endKm != null ? trip.endKm - trip.startKm : null;

                  return (
                    <TableRow key={trip.id}>
                      <TableCell className="font-medium">{trip.vehiclePlate}</TableCell>
                      <TableCell>{trip.driverName}</TableCell>
                      <TableCell>
                        <Badge className={tripStatusColors[trip.status] ?? ""}>
                          {tripStatusLabels[trip.status] ?? trip.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {formatDateTime(trip.startTime)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {trip.endTime ? formatDateTime(trip.endTime) : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {distance != null ? (
                          <span>
                            {distance.toLocaleString("it-IT")} km
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            {trip.startKm.toLocaleString("it-IT")} →
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                        {trip.notes || "—"}
                      </TableCell>
                      {canEditDelete ? (
                        <TableCell className="text-right">
                          <div className="inline-flex items-center gap-1">
                            <Button type="button" variant="outline" size="sm" onClick={() => setEditingId(trip.id)}>
                              Modifica
                            </Button>
                            <Button type="button" variant="destructive" size="sm" onClick={() => handleDelete(trip.id)}>
                              Elimina
                            </Button>
                          </div>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function TripEditRow({
  trip,
  colSpan,
  onCancel,
}: {
  trip: TripListItem;
  colSpan: number;
  onCancel: () => void;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<"OPEN" | "COMPLETED" | "ABANDONED">(trip.status as "OPEN" | "COMPLETED" | "ABANDONED");
  const [state, formAction] = useActionState(updateTrip, { error: "", success: "" });

  useEffect(() => {
    if (state?.success) {
      onCancel();
      router.refresh();
    }
  }, [state?.success, onCancel, router]);

  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="bg-muted/30 p-0 border-l-4 border-l-blue-500">
        <div className="p-4 w-full">
          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="tripId" value={trip.id} />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium">Stato</label>
                <select
                  name="status"
                  defaultValue={trip.status}
                  onChange={(event) => setStatus(event.target.value as "OPEN" | "COMPLETED" | "ABANDONED")}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="OPEN">In corso</option>
                  <option value="COMPLETED">Completato</option>
                  <option value="ABANDONED">Interrotto</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium">Data/Ora inizio</label>
                <input
                  type="datetime-local"
                  name="startTime"
                  defaultValue={toDateTimeLocal(trip.startTime)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium">Km inizio</label>
                <input
                  type="number"
                  name="startKm"
                  defaultValue={trip.startKm}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium">Data/Ora fine</label>
                <input
                  type="datetime-local"
                  name="endTime"
                  defaultValue={toDateTimeLocal(trip.endTime)}
                  disabled={status === "OPEN"}
                  required={status !== "OPEN"}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium">Km fine</label>
                <input
                  type="number"
                  name="endKm"
                  defaultValue={trip.endKm ?? ""}
                  disabled={status === "OPEN"}
                  required={status !== "OPEN"}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5 md:col-span-2 xl:col-span-1">
                <label className="text-xs font-medium">Note</label>
                <input
                  type="text"
                  name="notes"
                  defaultValue={trip.notes || ""}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <SubmitButton pendingText="Salvataggio...">Salva modifiche</SubmitButton>
              <Button type="button" variant="outline" onClick={onCancel}>Annulla</Button>
              {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
            </div>
          </form>
        </div>
      </TableCell>
    </TableRow>
  );
}
