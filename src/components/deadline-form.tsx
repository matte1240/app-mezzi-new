"use client";

import { useState, useActionState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ChevronUp } from "lucide-react";
import { createDeadline } from "@/lib/actions/deadline-actions";
import { deadlineTypeLabels } from "@/lib/labels";
import { SubmitButton } from "@/components/ui/submit-button";

type VehicleOption = { id: string; plate: string };

const deadlineTypes = Object.entries(deadlineTypeLabels);

export function DeadlineForm({ vehicles, canCreate }: { vehicles: VehicleOption[]; canCreate: boolean }) {
  const [showForm, setShowForm] = useState(false);
  const [state, formAction] = useActionState(createDeadline, undefined);

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Scadenze</h1>
          <p className="text-muted-foreground">
            Gestione scadenze flotta aziendale
          </p>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {showForm ? <ChevronUp className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            Nuova scadenza
          </button>
        )}
      </div>

      {showForm && canCreate && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Nuova scadenza manuale</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Mezzo *</label>
                <select name="vehicleId" required className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                  <option value="">Seleziona mezzo</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.plate}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Tipo *</label>
                <select name="type" required className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                  {deadlineTypes.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Data scadenza *</label>
                <input type="date" name="dueDate" required className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Preavviso (giorni)</label>
                <input type="number" name="reminderDays" min={0} defaultValue={30} className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
              </div>
              <div className="space-y-1.5 sm:col-span-2 lg:col-span-4">
                <label className="text-sm font-medium">Descrizione</label>
                <input type="text" name="description" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
              </div>
              <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-3">
                <SubmitButton pendingText="Salvataggio...">Registra</SubmitButton>
                {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
                {state?.success && <p className="text-sm text-green-600">Scadenza registrata!</p>}
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </>
  );
}
