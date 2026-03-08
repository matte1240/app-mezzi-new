"use client";

import { useState, useMemo, useActionState } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Plus, ChevronUp } from "lucide-react";
import Link from "next/link";
import { fuelLabels } from "@/lib/labels";
import { createRefueling } from "@/lib/actions/record-actions";
import { SubmitButton } from "@/components/ui/submit-button";

export type RifornimentoItem = {
  id: string;
  date: string;
  km: number;
  liters: string;
  costEur: string;
  fuelType: string;
  station: string | null;
  vehicleId: string;
  vehiclePlate: string;
  userName: string;
};

export type VehicleOptionFuel = {
  id: string;
  plate: string;
  fuelType: string;
};

export function RifornimentiList({ refuelings, vehicles, lastKmMap = {} }: { refuelings: RifornimentoItem[]; vehicles: VehicleOptionFuel[]; lastKmMap?: Record<string, number> }) {
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [state, formAction] = useActionState(createRefueling, undefined);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
  const lastKm = selectedVehicleId ? lastKmMap[selectedVehicleId] : undefined;

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return refuelings;
    return refuelings.filter((r) => {
      const haystack = [
        r.vehiclePlate,
        fuelLabels[r.fuelType] || r.fuelType,
        r.station || "",
        r.userName,
      ].join(" ").toLowerCase();
      return q.split(/\s+/).every((w) => haystack.includes(w));
    });
  }, [refuelings, query]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rifornimenti</h1>
          <p className="text-muted-foreground">
            Tutti i rifornimenti della flotta — {filtered.length} risultat{filtered.length === 1 ? "o" : "i"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {showForm ? <ChevronUp className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          Nuovo rifornimento
        </button>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Nuovo rifornimento</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <input type="hidden" name="fuelType" value={selectedVehicle?.fuelType || ""} />
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
                <label className="text-sm font-medium">Litri *</label>
                <input type="number" name="liters" required min={0.01} step={0.01} className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Costo (€) *</label>
                <input type="number" name="costEur" required min={0} step={0.01} className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Stazione</label>
                <input type="text" name="station" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Note</label>
                <input type="text" name="notes" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="fullTank" value="true" defaultChecked className="rounded border" />
                  Pieno
                </label>
              </div>
              <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-3">
                <SubmitButton pendingText="Salvataggio...">Registra</SubmitButton>
                {selectedVehicle && (
                  <span className="text-xs text-muted-foreground">
                    Carburante: {fuelLabels[selectedVehicle.fuelType]}
                  </span>
                )}
                {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
                {state?.success && <p className="text-sm text-green-600">Rifornimento registrato!</p>}
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
            placeholder="Cerca per targa, carburante, stazione, operatore..."
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
              <TableHead>Litri</TableHead>
              <TableHead>Costo</TableHead>
              <TableHead>€/L</TableHead>
              <TableHead>Carburante</TableHead>
              <TableHead>Stazione</TableHead>
              <TableHead>Operatore</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  Nessun rifornimento trovato
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => {
                const liters = Number(r.liters);
                const cost = Number(r.costEur);
                return (
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
                    <TableCell>{liters.toFixed(2)}</TableCell>
                    <TableCell>€{cost.toFixed(2)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      €{(cost / liters).toFixed(3)}
                    </TableCell>
                    <TableCell>{fuelLabels[r.fuelType]}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.station || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.userName}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
