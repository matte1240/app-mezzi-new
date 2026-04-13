"use client";

import { useActionState } from "react";
import { createMileageReading } from "@/lib/actions/record-actions";
import { SubmitButton } from "@/components/ui/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { MileageEditRow } from "./mileage-edit-row";
import { deleteRecord } from "@/lib/actions/record-actions";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import React from "react";
import { useState } from "react";

type Reading = {
  id: string;
  km: number;
  date: string;
  source: string;
  notes: string | null;
};

const sourceLabels: Record<string, string> = {
  MANUAL: "Manuale",
  REFUEL: "Rifornimento",
  MAINTENANCE: "Intervento",
  TRIP: "Viaggio",
};

export function MileageTab({
  vehicleId,
  lastKm = 0,
  canEditDelete = false,
  readings,
}: {
  vehicleId: string;
  lastKm?: number;
  canEditDelete?: boolean;
  readings: Reading[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (confirm("Sei sicuro di voler eliminare questo rilevamento?")) {
      await deleteRecord("mileage", id, vehicleId);
    }
  }
  const [state, formAction] = useActionState(createMileageReading, undefined);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Rilevamenti Chilometrici</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuovo Rilevamento
        </Button>
      </div>

      {showForm && (
        <form action={formAction} className="rounded-lg border p-4 space-y-4">
          {state?.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}
          {state?.success && (
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
              Rilevamento salvato
            </div>
          )}
          <input type="hidden" name="vehicleId" value={vehicleId} />
          <input type="hidden" name="source" value="MANUAL" />
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="km">Km *</Label>
              <Input id="km" name="km" type="number" required min={lastKm || 0} />
              {lastKm > 0 && (
                <p className="text-xs text-muted-foreground">Ultimo: {lastKm.toLocaleString("it-IT")} km</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Data *</Label>
              <Input
                id="date"
                name="date"
                type="date"
                required
                defaultValue={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Note</Label>
              <Input id="notes" name="notes" />
            </div>
          </div>
          <SubmitButton size="sm" pendingText="Salvataggio...">
            Salva
          </SubmitButton>
        </form>
      )}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Km</TableHead>
              <TableHead>Sorgente</TableHead>
              <TableHead>Note</TableHead>
              {canEditDelete ? <TableHead className="text-right">Azioni</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {readings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canEditDelete ? 5 : 4} className="text-center text-muted-foreground py-8">
                  Nessun rilevamento
                </TableCell>
              </TableRow>
            ) : (
              readings.map((r) => {
                if (expandedId === r.id) {
                  return <MileageEditRow key={r.id} item={r} vehicleId={vehicleId} onCancel={() => setExpandedId(null)} />;
                }
                return (
                <TableRow key={r.id}>
                  <TableCell>
                    {new Date(r.date).toLocaleDateString("it-IT")}
                  </TableCell>
                  <TableCell className="font-mono">
                    {r.km.toLocaleString("it-IT")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{sourceLabels[r.source]}</Badge>
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
                          <DropdownMenuItem className="text-red-600 focus:bg-red-50" onClick={() => handleDelete(r.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Elimina</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  ) : null}
                </TableRow>
              );})
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
