"use client";

import React, { useState, useMemo, useActionState, useEffect } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, Plus, ChevronUp, Check, X as XIcon, Trash2, CalendarPlus, Edit } from "lucide-react";
import Link from "next/link";
import {
  maintenanceTypeLabels,
} from "@/lib/labels";
import { createMaintenance, deleteRecord } from "@/lib/actions/record-actions";
import {
  createPlannedMaintenance,
  updatePlannedMaintenanceStatus,
  deletePlannedMaintenance,
  completePlannedMaintenance,
  updatePlannedMaintenance,
} from "@/lib/actions/planned-maintenance-actions";
import { SubmitButton } from "@/components/ui/submit-button";
import { MaintenanceEditRow } from "@/components/vehicles/maintenance-edit-row";

export type InterventoItem = {
  id: string;
  date: string;
  km: number;
  type: string;
  costEur: string | null;
  garage: string | null;
  description: string;
  notes: string | null;
  vehicleId: string;
  vehiclePlate: string;
  userName: string;
  sourceTripAnomalyId: string | null;
};

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
  sourceTripAnomalyId: string | null;
  sourceDeadlineId: string | null;
};

export type VehicleOption = {
  id: string;
  plate: string;
};

const maintenanceTypes = Object.entries(maintenanceTypeLabels);

export function InterventiList({
  interventions,
  vehicles,
  lastKmMap = {},
  plannedItems = [],
  canCreatePlanned = false,
  canEditDelete = false,
}: {
  interventions: InterventoItem[];
  vehicles: VehicleOption[];
  lastKmMap?: Record<string, number>;
  plannedItems?: PlannedItem[];
  canCreatePlanned?: boolean;
  canEditDelete?: boolean;
}) {
  const plannedCount = plannedItems.filter((i) => i.status === "PLANNED").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Interventi</h1>
        <p className="text-muted-foreground">
          Gestisci interventi di manutenzione eseguiti e pianificati
        </p>
      </div>

      <Tabs defaultValue="storico">
        <TabsList variant="line">
          <TabsTrigger value="storico">Storico ({interventions.length})</TabsTrigger>
          <TabsTrigger value="pianificati">
            Pianificati ({plannedCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="storico">
          <StoricoTab
            interventions={interventions}
            vehicles={vehicles}
            lastKmMap={lastKmMap}
            canEditDelete={canEditDelete}
          />
        </TabsContent>

        <TabsContent value="pianificati">
          <PianificatiTab
            items={plannedItems}
            vehicles={vehicles}
            canCreate={canCreatePlanned}
            canEditDelete={canEditDelete}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ───────────── Storico Tab ───────────── */

function StoricoTab({
  interventions,
  vehicles,
  lastKmMap,
  canEditDelete,
}: {
  interventions: InterventoItem[];
  vehicles: VehicleOption[];
  lastKmMap: Record<string, number>;
  canEditDelete: boolean;
}) {
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [state, formAction] = useActionState(createMaintenance, undefined);

  const lastKm = selectedVehicleId ? lastKmMap[selectedVehicleId] : undefined;

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return interventions;
    return interventions.filter((m) => {
      const haystack = [
        m.vehiclePlate,
        maintenanceTypeLabels[m.type] || m.type,
        m.garage || "",
        m.description,
        m.userName,
      ].join(" ").toLowerCase();
      return q.split(/\s+/).every((w) => haystack.includes(w));
    });
  }, [interventions, query]);

  async function handleDelete(id: string, vehicleId: string) {
    if (!confirm("Eliminare questo intervento?")) return;
    await deleteRecord("maintenance", id, vehicleId);
  }

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filtered.length} risultat{filtered.length === 1 ? "o" : "i"}
        </p>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {showForm ? <ChevronUp className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          Nuovo intervento
        </button>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Nuovo intervento di manutenzione</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                <label className="text-sm font-medium">Tipo *</label>
                <select name="type" required className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                  {maintenanceTypes.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Data *</label>
                <input type="date" name="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Km *</label>
                <input type="number" name="km" required min={lastKm ?? 1} className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
                {lastKm != null && (
                  <p className="text-xs text-muted-foreground">Ultimo: {lastKm.toLocaleString("it-IT")} km</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Costo (€)</label>
                <input type="number" name="costEur" min={0} step={0.01} className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Officina</label>
                <input type="text" name="garage" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-medium">Descrizione *</label>
                <input type="text" name="description" required className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
              </div>
              <div className="space-y-1.5 sm:col-span-2 lg:col-span-4">
                <label className="text-sm font-medium">Note</label>
                <input type="text" name="notes" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
              </div>
              <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-3">
                <SubmitButton pendingText="Salvataggio...">Registra</SubmitButton>
                {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
                {state?.success && <p className="text-sm text-green-600">Intervento registrato!</p>}
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
            placeholder="Cerca per targa, tipo, officina, descrizione..."
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
              <TableHead>Tipo</TableHead>
              <TableHead>Km</TableHead>
              <TableHead>Costo</TableHead>
              <TableHead>Officina</TableHead>
              <TableHead>Descrizione</TableHead>
              <TableHead>Origine</TableHead>
              <TableHead>Operatore</TableHead>
              {canEditDelete ? <TableHead className="text-right">Azioni</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canEditDelete ? 10 : 9} className="text-center text-muted-foreground py-8">
                  Nessun intervento trovato
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((m) => (
                expandedId === m.id ? (
                  <MaintenanceEditRow
                    key={m.id}
                    item={{
                      id: m.id,
                      type: m.type,
                      date: m.date,
                      km: m.km,
                      costEur: m.costEur ? Number(m.costEur) : null,
                      garage: m.garage,
                      description: m.description,
                      notes: m.notes,
                    }}
                    vehicleId={m.vehicleId}
                    colSpan={canEditDelete ? 10 : 9}
                    onCancel={() => setExpandedId(null)}
                  />
                ) : (
                  <TableRow key={m.id}>
                    <TableCell>
                      {new Date(m.date).toLocaleDateString("it-IT")}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/mezzi/${m.vehicleId}`}
                        className="font-mono font-semibold hover:underline"
                      >
                        {m.vehiclePlate}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {maintenanceTypeLabels[m.type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">
                      {m.km.toLocaleString("it-IT")}
                    </TableCell>
                    <TableCell>
                      {m.costEur ? `€${Number(m.costEur).toFixed(2)}` : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {m.garage || "—"}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {m.description}
                    </TableCell>
                    <TableCell>
                      {m.sourceTripAnomalyId ? (
                        <Link href={`/segnalazioni/${m.sourceTripAnomalyId}`}>
                          <Badge variant="outline" className="hover:bg-muted/40">Da segnalazione</Badge>
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">Manuale</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {m.userName}
                    </TableCell>
                    {canEditDelete ? (
                      <TableCell className="text-right">
                        <div className="inline-flex gap-1">
                          <button
                            type="button"
                            onClick={() => setExpandedId(m.id)}
                            className="rounded p-1 text-blue-600 hover:bg-blue-100"
                            title="Modifica"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(m.id, m.vehicleId)}
                            className="rounded p-1 text-red-500 hover:bg-red-100"
                            title="Elimina"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
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

/* ───────────── Pianificati Tab ───────────── */

function PianificatiTab({
  items,
  vehicles,
  canCreate,
  canEditDelete,
}: {
  items: PlannedItem[];
  vehicles: VehicleOption[];
  canCreate: boolean;
  canEditDelete: boolean;
}) {
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [state, formAction] = useActionState(createPlannedMaintenance, undefined);

  const planned = useMemo(() => items.filter((i) => i.status === "PLANNED"), [items]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return planned;
    return planned.filter((i) => {
      const haystack = [
        i.vehiclePlate,
        maintenanceTypeLabels[i.type] || i.type,
        i.description,
        i.garage || "",
        i.createdByName,
      ].join(" ").toLowerCase();
      return q.split(/\s+/).every((w) => haystack.includes(w));
    });
  }, [planned, query]);

  async function handleStatusChange(id: string, status: "COMPLETED" | "CANCELLED") {
    await updatePlannedMaintenanceStatus(id, status);
  }

  async function handleDelete(id: string) {
    if (!confirm("Eliminare questo intervento pianificato?")) return;
    await deletePlannedMaintenance(id);
  }

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filtered.length} interventi in programma
        </p>
        {canCreate && (
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {showForm ? <ChevronUp className="h-4 w-4" /> : <CalendarPlus className="h-4 w-4" />}
            Pianifica intervento
          </button>
        )}
      </div>

      {showForm && canCreate && (
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

      <div className="flex flex-wrap gap-3 items-center">
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
              <TableHead>Origine</TableHead>
              <TableHead>Creato da</TableHead>
              {canEditDelete && <TableHead className="text-right">Azioni</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canEditDelete ? 8 : 7} className="text-center text-muted-foreground py-8">
                  Nessun intervento pianificato
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => {
                const scheduledDate = new Date(item.scheduledDate);
                const isPast = scheduledDate < new Date();
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
                        <div className="flex flex-wrap items-center gap-1">
                          {item.sourceTripAnomalyId ? (
                            <Link href={`/segnalazioni/${item.sourceTripAnomalyId}`}>
                              <Badge variant="outline" className="hover:bg-muted/40">Segnalazione</Badge>
                            </Link>
                          ) : null}
                          {item.sourceDeadlineId ? (
                            <Badge variant="outline">Scadenza</Badge>
                          ) : null}
                          {!item.sourceTripAnomalyId && !item.sourceDeadlineId ? (
                            <span className="text-muted-foreground">Manuale</span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>{item.createdByName}</TableCell>
                      {canEditDelete && (
                        <TableCell className="text-right">
                          <div className="inline-flex gap-1">
                            <button
                              type="button"
                              onClick={() => setEditingId(editingId === item.id ? null : item.id)}
                              title="Modifica"
                              className="rounded p-1 text-blue-600 hover:bg-blue-100"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
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
                        </TableCell>
                      )}
                    </TableRow>
                    {expandedId === item.id && (
                      <CompleteRow item={item} onCancel={() => setExpandedId(null)} />
                    )}
                    {editingId === item.id && (
                      <PlannedEditRow item={item} onCancel={() => setEditingId(null)} />
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

/* ───────────── Complete Row (inline form) ───────────── */

function PlannedEditRow({
  item,
  onCancel,
}: {
  item: PlannedItem;
  onCancel: () => void;
}) {
  const [state, formAction] = useActionState(updatePlannedMaintenance, undefined);

  useEffect(() => {
    if (state?.success) {
      onCancel();
    }
  }, [state?.success, onCancel]);

  return (
    <TableRow>
      <TableCell colSpan={8} className="bg-muted/30 p-0 border-l-4 border-l-blue-500">
        <div className="p-4 w-full">
          <form action={formAction} className="flex flex-col gap-4 max-w-full w-full">
            <input type="hidden" name="plannedMaintenanceId" value={item.id} />

            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex flex-col gap-1.5 flex-1 min-w-0 w-full">
                <label className="text-xs font-medium whitespace-nowrap">Tipo *</label>
                <select name="type" defaultValue={item.type} className="w-full rounded-md border bg-background px-3 py-2 text-sm" required>
                  {maintenanceTypes.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5 flex-1 min-w-0 w-full">
                <label className="text-xs font-medium whitespace-nowrap">Data prevista *</label>
                <input
                  type="date"
                  name="scheduledDate"
                  defaultValue={item.scheduledDate.slice(0, 10)}
                  required
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
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
              <label className="text-xs font-medium whitespace-nowrap">Descrizione *</label>
              <input type="text" name="description" defaultValue={item.description} required className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
            </div>

            <div className="flex items-center gap-3 mt-2">
              <SubmitButton pendingText="Salvataggio...">Salva Modifiche</SubmitButton>
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

/* ───────────── Complete Row (inline form) ───────────── */

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
