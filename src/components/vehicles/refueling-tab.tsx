"use client";

import { useActionState } from "react";
import { createRefueling } from "@/lib/actions/record-actions";
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
import { Plus, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { RefuelingEditRow } from "./refueling-edit-row";
import { deleteRecord } from "@/lib/actions/record-actions";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import React from "react";
import { useState } from "react";


type RefuelingRecord = {
  id: string;
  date: string;
  km: number;
  liters: number;
  costEur: number;
  fuelType: string;
  fullTank: boolean;
  station: string | null;
  notes: string | null;
  userName: string;
};

export function RefuelingTab({
  vehicleId,
  vehicleFuelType,
  lastKm = 0,
  refuelings,
}: {
  vehicleId: string;
  vehicleFuelType: string;
  lastKm?: number;
  refuelings: RefuelingRecord[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (confirm("Sei sicuro di voler eliminare questo rifornimento?")) {
      await deleteRecord("refueling", id, vehicleId);
    }
  }
  const [state, formAction] = useActionState(createRefueling, undefined);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Rifornimenti</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuovo Rifornimento
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
              Rifornimento salvato
            </div>
          )}
          <input type="hidden" name="vehicleId" value={vehicleId} />
          <input type="hidden" name="fuelType" value={vehicleFuelType} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              <Label htmlFor="km">Km *</Label>
              <Input id="km" name="km" type="number" required min={lastKm || 0} />
              {lastKm > 0 && (
                <p className="text-xs text-muted-foreground">Ultimo: {lastKm.toLocaleString("it-IT")} km</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="liters">Litri *</Label>
              <Input
                id="liters"
                name="liters"
                type="number"
                step="0.01"
                required
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="costEur">Costo € *</Label>
              <Input
                id="costEur"
                name="costEur"
                type="number"
                step="0.01"
                required
                min={0}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="station">Stazione</Label>
              <Input id="station" name="station" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Note</Label>
              <Input id="notes" name="notes" />
            </div>
            <div className="flex items-end gap-2 pb-1">
              <input
                type="checkbox"
                id="fullTank"
                name="fullTank"
                defaultChecked
                className="h-4 w-4"
              />
              <Label htmlFor="fullTank">Pieno</Label>
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
              <TableHead>Litri</TableHead>
              <TableHead>Costo</TableHead>
              <TableHead>€/L</TableHead>
              <TableHead>Stazione</TableHead>
              <TableHead>Pieno</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {refuelings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Nessun rifornimento
                </TableCell>
              </TableRow>
            ) : (
              refuelings.map((r) => {
                if (expandedId === r.id) {
                  return <RefuelingEditRow key={r.id} item={r} vehicleId={vehicleId} vehicleFuelType={vehicleFuelType} onCancel={() => setExpandedId(null)} />;
                }
                return (
                <TableRow key={r.id}>
                  <TableCell>
                    {new Date(r.date).toLocaleDateString("it-IT")}
                  </TableCell>
                  <TableCell className="font-mono">
                    {r.km.toLocaleString("it-IT")}
                  </TableCell>
                  <TableCell>{r.liters.toFixed(2)}</TableCell>
                  <TableCell>€{r.costEur.toFixed(2)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    €{(r.costEur / r.liters).toFixed(3)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.station || "—"}
                  </TableCell>
                  <TableCell>{r.fullTank ? "Sì" : "No"}</TableCell>
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
                </TableRow>
              );})
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
