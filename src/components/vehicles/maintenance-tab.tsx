"use client";

import { useActionState } from "react";
import { createMaintenance } from "@/lib/actions/record-actions";
import { SubmitButton } from "@/components/ui/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { useState } from "react";
import { maintenanceTypeLabels } from "@/lib/labels";

type MaintenanceRecord = {
  id: string;
  type: string;
  date: string;
  km: number;
  costEur: number | null;
  garage: string | null;
  description: string;
  notes: string | null;
  userName: string;
};

export function MaintenanceTab({
  vehicleId,
  interventions,
}: {
  vehicleId: string;
  interventions: MaintenanceRecord[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [state, formAction] = useActionState(createMaintenance, undefined);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Interventi di Manutenzione</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuovo Intervento
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
              Intervento salvato
            </div>
          )}
          <input type="hidden" name="vehicleId" value={vehicleId} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo *</Label>
              <select
                id="type"
                name="type"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                required
              >
                <option value="TAGLIANDO">Tagliando</option>
                <option value="REVISIONE">Revisione</option>
                <option value="RIPARAZIONE">Riparazione</option>
                <option value="CAMBIO_GOMME">Cambio gomme</option>
                <option value="ALTRO">Altro</option>
              </select>
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
              <Label htmlFor="km">Km *</Label>
              <Input id="km" name="km" type="number" required min={0} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="costEur">Costo €</Label>
              <Input
                id="costEur"
                name="costEur"
                type="number"
                step="0.01"
                min={0}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="garage">Officina</Label>
              <Input id="garage" name="garage" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Note</Label>
              <Input id="notes" name="notes" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrizione *</Label>
            <Textarea id="description" name="description" required rows={2} />
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
              <TableHead>Tipo</TableHead>
              <TableHead>Km</TableHead>
              <TableHead>Costo</TableHead>
              <TableHead>Officina</TableHead>
              <TableHead>Descrizione</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {interventions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nessun intervento
                </TableCell>
              </TableRow>
            ) : (
              interventions.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    {new Date(m.date).toLocaleDateString("it-IT")}
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
                    {m.costEur != null ? `€${m.costEur.toFixed(2)}` : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {m.garage || "—"}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {m.description}
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
