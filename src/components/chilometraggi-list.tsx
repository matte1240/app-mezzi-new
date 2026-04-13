"use client";

import { useState, useMemo, useActionState } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Plus, ChevronUp, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { createMileageReading, deleteRecord } from "@/lib/actions/record-actions";
import { SubmitButton } from "@/components/ui/submit-button";
import { MileageEditRow } from "@/components/vehicles/mileage-edit-row";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export type MileageItem = {
  id: string;
  date: string;
  km: number;
  source: string;
  notes: string | null;
  vehicleId: string;
  vehiclePlate: string;
  recordedByName: string;
};

export type VehicleOption = {
  id: string;
  plate: string;
};

const sourceLabels: Record<string, string> = {
  MANUAL: "Manuale",
  REFUEL: "Rifornimento",
  MAINTENANCE: "Intervento",
  TRIP: "Viaggio",
};

export function ChilometraggiList({ readings, vehicles, lastKmMap = {}, canEditDelete = false }: { readings: MileageItem[]; vehicles: VehicleOption[]; lastKmMap?: Record<string, number>; canEditDelete?: boolean }) {
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [state, formAction] = useActionState(createMileageReading, undefined);

  async function handleDelete(id: string, vehicleId: string) {
    if (!confirm("Eliminare questo rilevamento?")) return;
    await deleteRecord("mileage", id, vehicleId);
  }

  const lastKm = selectedVehicleId ? lastKmMap[selectedVehicleId] : undefined;

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return readings;
    return readings.filter((r) => {
      const haystack = [
        r.vehiclePlate,
        sourceLabels[r.source] || r.source,
        r.recordedByName,
        r.notes || "",
        r.km.toString(),
      ].join(" ").toLowerCase();
      return q.split(/\s+/).every((w) => haystack.includes(w));
    });
  }, [readings, query]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Chilometraggi</h1>
          <p className="text-muted-foreground">
            Tutti i rilevamenti chilometrici — {filtered.length} risultat{filtered.length === 1 ? "o" : "i"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {showForm ? <ChevronUp className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          Nuovo rilevamento
        </button>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Nuovo rilevamento chilometrico</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <input type="hidden" name="source" value="MANUAL" />
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Mezzo *</label>
                <select
                  name="vehicleId"
                  required
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="">Seleziona mezzo</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.plate}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Km *</label>
                <input type="number" name="km" required min={lastKm ?? 1} className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
                {lastKm != null && (
                  <p className="text-xs text-muted-foreground">Ultimo: {lastKm.toLocaleString("it-IT")} km</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Data *</label>
                <input type="date" name="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Note</label>
                <input type="text" name="notes" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
              </div>
              <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-3">
                <SubmitButton pendingText="Salvataggio...">Registra</SubmitButton>
                {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
                {state?.success && <p className="text-sm text-green-600">Rilevamento registrato!</p>}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca per targa, sorgente, operatore..."
            className="w-full rounded-lg border bg-background pl-10 pr-3 py-2 text-sm"
          />
        </div>
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
          >
            Azzera
          </button>
        )}
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Targa</TableHead>
              <TableHead>Km</TableHead>
              <TableHead>Sorgente</TableHead>
              <TableHead>Rilevato da</TableHead>
              <TableHead>Note</TableHead>
              {canEditDelete ? <TableHead className="text-right">Azioni</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canEditDelete ? 7 : 6} className="text-center text-muted-foreground py-8">
                  Nessun rilevamento trovato
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                expandedId === r.id ? (
                  <MileageEditRow
                    key={r.id}
                    item={{ id: r.id, date: r.date, km: r.km, source: r.source, notes: r.notes }}
                    vehicleId={r.vehicleId}
                    colSpan={canEditDelete ? 7 : 6}
                    onCancel={() => setExpandedId(null)}
                  />
                ) : (
                  <TableRow key={r.id}>
                    <TableCell>
                      {new Date(r.date).toLocaleDateString("it-IT")}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/mezzi/${r.vehicleId}`}
                        className="font-mono font-semibold hover:underline"
                      >
                        {r.vehiclePlate}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono">
                      {r.km.toLocaleString("it-IT")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{sourceLabels[r.source]}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.recordedByName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.notes || "—"}
                    </TableCell>
                    {canEditDelete ? (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" />}>
                            <span className="sr-only">Apri menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setExpandedId(r.id)}>
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Modifica</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600 focus:bg-red-50" onClick={() => handleDelete(r.id, r.vehicleId)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Elimina</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    ) : null}
                  </TableRow>
                )
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
