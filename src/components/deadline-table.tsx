"use client";

import { useState, useActionState, Fragment } from "react";
import Link from "next/link";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Check, RotateCcw, Trash2, CalendarPlus, ChevronUp } from "lucide-react";
import { deadlineTypeLabels, maintenanceTypeLabels } from "@/lib/labels";
import { toggleDeadlineComplete, deleteDeadline } from "@/lib/actions/deadline-actions";
import { createPlannedMaintenance } from "@/lib/actions/planned-maintenance-actions";

export type DeadlineItem = {
  id: string;
  vehicleId: string;
  vehiclePlate: string;
  type: string;
  dueDate: string;
  dueKm: number | null;
  description: string | null;
  completed: boolean;
  status: string;
};

const statusBadge: Record<string, { label: string; className: string }> = {
  completed: { label: "Completata", className: "bg-green-100 text-green-800" },
  overdue: { label: "Scaduta", className: "bg-red-100 text-red-800" },
  upcoming: { label: "In scadenza", className: "bg-orange-100 text-orange-800" },
  ok: { label: "OK", className: "bg-blue-100 text-blue-800" },
};

const deadlineToMaintenanceType: Record<string, string> = {
  TAGLIANDO: "TAGLIANDO",
  REVISIONE: "REVISIONE",
  ASSICURAZIONE: "ALTRO",
  BOLLO: "ALTRO",
  REVISIONE_TACHIGRAFO: "ALTRO",
  ALTRO: "ALTRO",
};

const maintenanceTypes = Object.entries(maintenanceTypeLabels);

export function DeadlineTableClient({
  items,
  canManage,
  showDelete = false,
}: {
  items: DeadlineItem[];
  canManage: boolean;
  showDelete?: boolean;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const colSpan = canManage ? 7 : 6;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Targa</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Data Scadenza</TableHead>
          <TableHead>Scadenza Km</TableHead>
          <TableHead>Stato</TableHead>
          <TableHead>Descrizione</TableHead>
          {canManage && <TableHead>Azioni</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length === 0 ? (
          <TableRow>
            <TableCell colSpan={colSpan} className="text-center text-muted-foreground py-8">
              Nessuna scadenza trovata
            </TableCell>
          </TableRow>
        ) : (
          items.map((d) => {
            const badge = statusBadge[d.status] || statusBadge.ok;
            const isExpanded = expandedId === d.id;
            return (
              <Fragment key={d.id}>
                <TableRow className={isExpanded ? "border-b-0 bg-blue-50/40" : ""}>
                  <TableCell>
                    <Link
                      href={`/mezzi/${d.vehicleId}`}
                      className="font-mono font-semibold hover:underline"
                    >
                      {d.vehiclePlate}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {deadlineTypeLabels[d.type]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(d.dueDate).toLocaleDateString("it-IT")}
                  </TableCell>
                  <TableCell>
                    {d.dueKm ? `${d.dueKm.toLocaleString("it-IT")} km` : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={badge.className}>
                      {badge.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {d.description || "—"}
                  </TableCell>
                  {canManage && (
                    <TableCell>
                      <div className="flex gap-1">
                        <form action={async () => { await toggleDeadlineComplete(d.id); }}>
                          <Button
                            type="submit"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title={d.completed ? "Riapri" : "Completa"}
                          >
                            {d.completed ? (
                              <RotateCcw className="h-4 w-4" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </Button>
                        </form>
                        {!d.completed && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 ${isExpanded ? "text-blue-800 bg-blue-100" : "text-blue-600"}`}
                            title="Pianifica intervento"
                            onClick={() => setExpandedId(isExpanded ? null : d.id)}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <CalendarPlus className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        {showDelete && (
                          <form action={async () => { await deleteDeadline(d.id); }}>
                            <Button
                              type="submit"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              title="Elimina"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </form>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
                {isExpanded && (
                  <TableRow className="bg-blue-50/40 hover:bg-blue-50/60">
                    <TableCell colSpan={colSpan} className="p-0">
                      <PlanRow
                        vehicleId={d.vehicleId}
                        vehiclePlate={d.vehiclePlate}
                        deadlineType={d.type}
                        dueDate={d.dueDate}
                        description={d.description}
                        onClose={() => setExpandedId(null)}
                      />
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}

function PlanRow({
  vehicleId,
  vehiclePlate,
  deadlineType,
  dueDate,
  description,
  onClose,
}: {
  vehicleId: string;
  vehiclePlate: string;
  deadlineType: string;
  dueDate: string;
  description: string | null;
  onClose: () => void;
}) {
  const [state, formAction] = useActionState(createPlannedMaintenance, undefined);

  const mappedType = deadlineToMaintenanceType[deadlineType] || "ALTRO";
  const defaultDesc = description || `${deadlineType} — ${vehiclePlate}`;
  const dateValue = dueDate.slice(0, 10);

  if (state?.success) {
    return (
      <div className="flex items-center gap-3 px-4 py-3">
        <p className="text-sm text-green-600 font-medium">Intervento pianificato!</p>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
        >
          Chiudi
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="px-4 py-3">
      <input type="hidden" name="vehicleId" value={vehicleId} />
      <div className="flex flex-col gap-4 max-w-full w-full">
        {/* Riga 1: Tipo + Data */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex flex-col gap-1.5 flex-1 min-w-0 w-full">
            <label className="text-xs font-medium whitespace-nowrap">Tipo</label>
            <select
              name="type"
              defaultValue={mappedType}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              {maintenanceTypes.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5 flex-1 min-w-0 w-full">
            <label className="text-xs font-medium whitespace-nowrap">Data prevista</label>
            <input
              type="date"
              name="scheduledDate"
              defaultValue={dateValue}
              required
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Riga 2: Officina + Note */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex flex-col gap-1.5 flex-1 min-w-0 w-full">
            <label className="text-xs font-medium whitespace-nowrap">Officina</label>
            <input
              type="text"
              name="garage"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5 flex-1 min-w-0 w-full">
            <label className="text-xs font-medium whitespace-nowrap">Note</label>
            <input
              type="text"
              name="notes"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Riga 3: Descrizione */}
        <div className="flex flex-col gap-1.5 min-w-0 w-full">
          <label className="text-xs font-medium whitespace-nowrap">Descrizione *</label>
          <input
            type="text"
            name="description"
            defaultValue={defaultDesc}
            required
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 mt-3">
        <SubmitButton pendingText="Salvataggio...">Pianifica</SubmitButton>
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
        >
          Annulla
        </button>
        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      </div>
    </form>
  );
}
