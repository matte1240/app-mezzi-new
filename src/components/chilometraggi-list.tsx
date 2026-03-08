"use client";

import { useState, useMemo, useActionState } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Plus, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { createMileageReading } from "@/lib/actions/record-actions";
import { SubmitButton } from "@/components/ui/submit-button";

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
};

export function ChilometraggiList({ readings, vehicles, lastKmMap = {} }: { readings: MileageItem[]; vehicles: VehicleOption[]; lastKmMap?: Record<string, number> }) {
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [state, formAction] = useActionState(createMileageReading, undefined);

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
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nessun rilevamento trovato
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
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
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
