"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, TriangleAlert, Camera, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  tripAnomalyTypeLabels,
  tripAnomalyStatusLabels,
  tripAnomalyStatusColors,
} from "@/lib/labels";

export type TripAnomalyListItem = {
  id: string;
  tripId: string;
  vehicleId: string;
  vehiclePlate: string;
  driverName: string;
  type: string;
  status: string;
  message: string;
  isManual: boolean;
  createdAt: string;
  createdByName: string;
  photoCount: number;
};

function formatDateTime(iso: string) {
  const date = new Date(iso);
  return `${date.toLocaleDateString("it-IT")} ${date.toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export function TripAnomaliesList({
  anomalies,
}: {
  anomalies: TripAnomalyListItem[];
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [photoFilter, setPhotoFilter] = useState<string>("ALL");

  const filtered = useMemo(() => {
    let list = anomalies;

    if (statusFilter !== "ALL") {
      list = list.filter((item) => item.status === statusFilter);
    }

    if (typeFilter !== "ALL") {
      list = list.filter((item) => item.type === typeFilter);
    }

    if (photoFilter === "WITH") {
      list = list.filter((item) => item.photoCount > 0);
    }

    if (photoFilter === "WITHOUT") {
      list = list.filter((item) => item.photoCount === 0);
    }

    const normalizedQuery = query.trim().toLowerCase();
    if (normalizedQuery) {
      const words = normalizedQuery.split(/\s+/).filter(Boolean);
      list = list.filter((item) => {
        const haystack = [
          item.vehiclePlate,
          item.driverName,
          item.message,
          tripAnomalyTypeLabels[item.type] || item.type,
          item.createdByName,
        ]
          .join(" ")
          .toLowerCase();

        return words.every((word) => haystack.includes(word));
      });
    }

    return list;
  }, [anomalies, query, statusFilter, typeFilter, photoFilter]);

  const counts = useMemo(() => {
    return {
      total: anomalies.length,
      open: anomalies.filter((item) => item.status === "OPEN").length,
      inReview: anomalies.filter((item) => item.status === "IN_REVIEW").length,
      resolved: anomalies.filter((item) => item.status === "RESOLVED").length,
    };
  }, [anomalies]);

  const availableTypes = useMemo(
    () => [...new Set(anomalies.map((item) => item.type))],
    [anomalies]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Segnalazioni</h1>
        <p className="text-sm text-muted-foreground">
          Monitoraggio anomalie viaggio con foto e stato operativo
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Totali</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{counts.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aperte</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{counts.open}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In lavorazione</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{counts.inReview}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Risolte</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{counts.resolved}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-4">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cerca per targa, autista o testo segnalazione"
            className="w-full rounded-md border bg-background py-2 pl-9 pr-3 text-sm"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="ALL">Tutti gli stati</option>
          <option value="OPEN">Aperte</option>
          <option value="IN_REVIEW">In lavorazione</option>
          <option value="RESOLVED">Risolte</option>
        </select>

        <div className="grid gap-3 sm:grid-cols-2">
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="ALL">Tutti i tipi</option>
            {availableTypes.map((type) => (
              <option key={type} value={type}>
                {tripAnomalyTypeLabels[type] || type}
              </option>
            ))}
          </select>

          <select
            value={photoFilter}
            onChange={(event) => setPhotoFilter(event.target.value)}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="ALL">Foto: tutte</option>
            <option value="WITH">Con foto</option>
            <option value="WITHOUT">Senza foto</option>
          </select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Mezzo</TableHead>
                <TableHead>Autista</TableHead>
                <TableHead>Foto</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Messaggio</TableHead>
                <TableHead className="text-right">Dettaglio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                    Nessuna segnalazione trovata
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        <TriangleAlert className="h-3 w-3" />
                        {tripAnomalyTypeLabels[item.type] || item.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={tripAnomalyStatusColors[item.status] || ""}>
                        {tripAnomalyStatusLabels[item.status] || item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{item.vehiclePlate}</TableCell>
                    <TableCell>{item.driverName}</TableCell>
                    <TableCell>
                      <div className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                        <Camera className="h-3.5 w-3.5" />
                        {item.photoCount}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {formatDateTime(item.createdAt)}
                    </TableCell>
                    <TableCell className="max-w-[280px] truncate text-sm text-muted-foreground">
                      {item.message}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/segnalazioni/${item.id}`}>
                        <Button type="button" variant="outline" size="sm" className="gap-1">
                          <Eye className="h-3.5 w-3.5" />
                          Apri
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
