"use client";

import React, { useActionState, useEffect } from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { updateMileageReading } from "@/lib/actions/record-actions";
import { SubmitButton } from "@/components/ui/submit-button";

type MileageEditItem = {
  id: string;
  date: string;
  km: number;
  source: string;
  notes: string | null;
};

export function MileageEditRow({ item, vehicleId, onCancel }: { item: MileageEditItem; vehicleId: string; onCancel: () => void }) {
  const [state, formAction] = useActionState(updateMileageReading, undefined);

  useEffect(() => {
    if (state?.success) {
      onCancel();
    }
  }, [state?.success, onCancel]);

  return (
    <TableRow>
      <TableCell colSpan={6} className="bg-muted/30 p-0 border-l-4 border-l-blue-500">
        <div className="p-4 w-full">
          <form action={formAction} className="flex flex-col gap-4 max-w-full w-full">
            <input type="hidden" name="id" value={item.id} />
            <input type="hidden" name="vehicleId" value={vehicleId} />
            <input type="hidden" name="source" value={item.source} /> {/* Preseve source */}
            
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex flex-col gap-1.5 flex-1 min-w-0 w-full">
                <label className="text-xs font-medium whitespace-nowrap">Data *</label>
                <input type="date" name="date" defaultValue={item.date.split("T")[0]} required className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
              </div>
              <div className="flex flex-col gap-1.5 flex-1 min-w-0 w-full">
                <label className="text-xs font-medium whitespace-nowrap">Chilometraggio (Km) *</label>
                <input type="number" name="km" defaultValue={item.km} required className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 min-w-0 w-full">
              <label className="text-xs font-medium whitespace-nowrap">Note / Motivo</label>
              <input type="text" name="notes" defaultValue={item.notes || ""} className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
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
