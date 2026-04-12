"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Search, TriangleAlert } from "lucide-react";
import {
  tripStatusLabels,
  tripAnomalyTypeLabels,
  tripAnomalyStatusLabels,
} from "@/lib/labels";

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
  anomalies: {
    id: string;
    type: string;
    status: string;
    message: string;
    isManual: boolean;
    photoCount: number;
  }[];
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

export function TripsDesktopList({ trips }: { trips: TripListItem[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

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
          t.anomalies.map((a) => tripAnomalyStatusLabels[a.status] || a.status).join(" "),
          t.anomalies.map((a) => a.message).join(" "),
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
  const anomalyCount = trips.filter((t) => t.anomalies.length > 0).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Viaggi</h1>
        <p className="text-sm text-muted-foreground">
          Registro completo dei viaggi della flotta
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Con anomalie</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">{anomalyCount}</p>
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
                <TableHead>Anomalie</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                    Nessun viaggio trovato
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((trip) => {
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
                      <TableCell>
                        {trip.anomalies.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {trip.anomalies.map((a) => (
                              <Link key={a.id} href={`/segnalazioni/${a.id}`}>
                                <Badge
                                  variant="outline"
                                  className="gap-1 border-orange-300 text-orange-700 hover:bg-orange-50"
                                >
                                  <TriangleAlert className="h-3 w-3" />
                                  {tripAnomalyTypeLabels[a.type] ?? a.type}
                                  <span className="text-orange-500/80">·</span>
                                  {tripAnomalyStatusLabels[a.status] ?? a.status}
                                  {a.photoCount > 0 ? (
                                    <span className="inline-flex items-center gap-0.5">
                                      <Camera className="h-3 w-3" />
                                      {a.photoCount}
                                    </span>
                                  ) : null}
                                </Badge>
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                        {trip.notes || "—"}
                      </TableCell>
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
