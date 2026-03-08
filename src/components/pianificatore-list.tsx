"use client";

import React, { useState, useMemo, useActionState, useEffect } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Plus, ChevronUp, Check, X as XIcon, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  maintenanceTypeLabels,
  plannedMaintenanceStatusLabels,
  plannedMaintenanceStatusColors,
} from "@/lib/labels";
import { createPlannedMaintenance, updatePlannedMaintenanceStatus, deletePlannedMaintenance, completePlannedMaintenance } from "@/lib/actions/planned-maintenance-actions";
import { SubmitButton } from "@/components/ui/submit-button";

export type PlannedItem = {
  id: string;
  vehicleId: string;
  vehiclePlate: string;
  vehicleCurrentKm: number;
  type: string;
  scheduledDate: string;
  description: string;
  garage: string | null;
  notes: string | null;
  status: string;
  createdByName: string;
};

export type VehicleOption = {
  id: string;
  plate: string;
};

const maintenanceTypes = Object.entries(maintenanceTypeLabels);

export function PianificatoreList({
  items,
  vehicles,
  canManage,
}: {
  items: PlannedItem[];
  vehicles: VehicleOption[];
  canManage: boolean;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("PLANNED");
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [state, formAction] = useActionState(createPlannedMaintenance, undefined);

  const filtered = useMemo(() => {
    let result = items;
    if (statusFilter) {
      result = result.filter((i) => i.status === statusFilter);
    }
    const q = query.toLowerCase().trim();
    if (q) {
      result = result.filter((i) => {
        const haystack = [
          i.vehiclePlate,
          maintenanceTypeLabels[i.type] || i.type,
          i.description,
          i.garage || "",
          i.createdByName,
        ].join(" ").toLowerCase();
        return q.split(/\s+/).every((w) => haystack.includes(w));
      });
    }
    return result;
  }, [items, query, statusFilter]);

  const counts = useMemo(() => {
    const c = { PLANNED: 0, COMPLETED: 0, CANCELLED: 0, all: items.length };
    for (const i of items) {
      if (i.status in c) (c as Record<string, number>)[i.status]++;
    }
    return c;
  }, [items]);

  async function handleStatusChange(id: string, status: "COMPLETED" | "CANCELLED") {
    await updatePlannedMaintenanceStatus(id, status);
  }

  async function handleDelete(id: string) {
    if (!confirm("Eliminare questo intervento pianificato?")) return;
    await deletePlannedMaintenance(id);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pianificatore Interventi</h1>
          <p className="text-muted-foreground">
            Pianifica e gestisci gli interventi di manutenzione futuri
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {showForm ? <ChevronUp className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            Nuovo intervento
          </button>
        )}
      </div>

      {showForm && canManage && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Pianifica nuovo intervento</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Mezzo *</label>
                <select
                  name="vehicleId"
                  required
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="">Seleziona mezzo</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.plate}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Tipo *</label>
                <select name="type" required className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                  {maintenanceTypes.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Data prevista *</label>
                <input type="date" name="scheduledDate" required className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-medium">Descrizione *</label>
                <input type="text" name="description" required className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Officina</label>
                <input type="text" name="garage" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
              </div>
              <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                <label className="text-sm font-medium">Note</label>
                <input type="text" name="notes" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
              </div>
              <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-3">
                <SubmitButton pendingText="Salvataggio...">Pianifica</SubmitButton>
                {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
                {state?.success && <p className="text-sm text-green-600">Intervento pianificato!</p>}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1.5">
          {[
            { value: "", label: `Tutti (${counts.all})` },
            { value: "PLANNED", label: `Pianificati (${counts.PLANNED})` },
            { value: "COMPLETED", label: `Completati (${counts.COMPLETED})` },
            { value: "CANCELLED", label: `Annullati (${counts.CANCELLED})` },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatusFilter(opt.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca per targa, tipo, descrizione, officina..."
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

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data prevista</TableHead>
              <TableHead>Targa</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Descrizione</TableHead>
              <TableHead>Officina</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead>Creato da</TableHead>
              {canManage && <TableHead className="text-right">Azioni</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManage ? 8 : 7} className="text-center text-muted-foreground py-8">
                  Nessun intervento pianificato trovato
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => {
                const isPlanned = item.status === "PLANNED";
                const scheduledDate = new Date(item.scheduledDate);
                const isPast = isPlanned && scheduledDate < new Date();
                return (
                  <React.Fragment key={item.id}>
                    <TableRow className={isPast ? "bg-red-50/50" : ""}>
                      <TableCell className={isPast ? "text-red-600 font-medium" : ""}>
                        {scheduledDate.toLocaleDateString("it-IT")}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/mezzi/${item.vehicleId}`}
                          className="font-mono font-semibold hover:underline"
                        >
                          {item.vehiclePlate}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {maintenanceTypeLabels[item.type] || item.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{item.description}</TableCell>
                      <TableCell>{item.garage || "—"}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${plannedMaintenanceStatusColors[item.status] || ""}`}>
                          {plannedMaintenanceStatusLabels[item.status] || item.status}
                        </span>
                      </TableCell>
                      <TableCell>{item.createdByName}</TableCell>
                      {canManage && (
                        <TableCell className="text-right">
                          {isPlanned && (
                            <div className="inline-flex gap-1">
                              <button
                                type="button"
                                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                                title="Segna come completato"
                                className="rounded p-1 text-green-600 hover:bg-green-100"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(item.id, "CANCELLED")}
                                title="Annulla"
                                className="rounded p-1 text-gray-500 hover:bg-gray-100"
                              >
                                <XIcon className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(item.id)}
                                title="Elimina"
                                className="rounded p-1 text-red-500 hover:bg-red-100"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                    {expandedId === item.id && isPlanned && (
                      <CompleteRow item={item} onCancel={() => setExpandedId(null)} />
                    )}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function CompleteRow({
  item,
  onCancel,
}: {
  item: PlannedItem;
  onCancel: () => void;
}) {
  const [state, formAction] = useActionState(completePlannedMaintenance, undefined);
  const dateValue = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (state?.success) {
      onCancel();
    }
  }, [state?.success, onCancel]);

  return (
    <TableRow>
      <TableCell colSpan={8} className="bg-muted/30 p-0 border-l-4 border-l-green-500">
        <div className="p-4 w-full">
          <form action={formAction} className="flex flex-col gap-4 max-w-full w-full">
            <input type="hidden" name="plannedMaintenanceId" value={item.id} />
            <input type="hidden" name="vehicleId" value={item.vehicleId} />
            
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex flex-col gap-1.5 flex-1 min-w-0 w-full">
                <label className="text-xs font-medium whitespace-nowrap">Tipo *</label>
                <select name="type" defaultValue={item.type} className="w-full rounded-md border bg-background px-3 py-2 text-sm" required>
                  {maintenanceTypes.map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5 flex-1 min-w-0 w-full">
                <label className="text-xs font-medium whitespace-nowrap">Data Completamento *</label>
                <input type="date" name="date" defaultValue={dateValue} required className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex flex-col gap-1.5 flex-1 min-w-0 w-full">
                <label className="text-xs font-medium whitespace-nowrap">Chilometraggio (Km) * <span className="text-muted-foreground font-normal ml-1">(ultimo: {item.vehicleCurrentKm} km)</span></label>
                <input type="number" name="km" required className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder={`Es. ${item.vehicleCurrentKm + 100}`} />
              </div>
              <div className="flex flex-col gap-1.5 flex-1 min-w-0 w-full">
                <label className="text-xs font-medium whitespace-nowrap">Costo (€)</label>
                <input type="number" step="0.01" name="costEur" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex flex-col gap-1.5 flex-1 min-w-0 w-full">
                <label className="text-xs font-medium whitespace-nowrap">Officina</label>
                <input type="text" name="garage" defaultValue={item.garage || ""} className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
              </div>
              <div className="flex flex-col gap-1.5 flex-1 min-w-0 w-full">
                <label className="text-xs font-medium whitespace-nowrap">Note</label>
                <input type="text" name="notes" defaultValue={item.notes || ""} className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 min-w-0 w-full">
              <label className="text-xs font-medium whitespace-nowrap">Descrizione Lavori *</label>
              <input type="text" name="description" defaultValue={item.description} required className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
            </div>

            <div className="flex items-center gap-3 mt-2">
              <SubmitButton pendingText="Completamento...">Completa Intervento</SubmitButton>
              <button
                type="button"
                onClick={onCancel}
                className="text-sm font-medium text-muted-foreground hover:underline"
              >
                Annulla
              </button>
              {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
            </div>
          </form>
        </div>
      </TableCell>
    </TableRow>
  );
}
