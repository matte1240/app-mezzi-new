"use client";

import React, { useActionState, useEffect } from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { updateRefueling } from "@/lib/actions/record-actions";
import { SubmitButton } from "@/components/ui/submit-button";

type RefuelingEditItem = {
  id: string;
  date: string;
  km: number;
  liters: number;
  costEur: number;
  fuelType: string;
  fullTank: boolean;
  station: string | null;
  notes: string | null;
};

export function RefuelingEditRow({ item, vehicleId, vehicleFuelType, onCancel, colSpan = 8 }: { item: RefuelingEditItem; vehicleId: string; vehicleFuelType: string; onCancel: () => void; colSpan?: number }) {
  const [state, formAction] = useActionState(updateRefueling, undefined);

  useEffect(() => {
    if (state?.success) {
      onCancel();
    }
  }, [state?.success, onCancel]);

  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="bg-muted/30 p-0 border-l-4 border-l-blue-500">
        <div className="p-4 w-full">
          <form action={formAction} className="flex flex-col gap-4 max-w-full w-full">
            <input type="hidden" name="id" value={item.id} />
            <input type="hidden" name="vehicleId" value={vehicleId} />
            
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
            
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex flex-col gap-1.5 flex-1 min-w-0 w-full">
                <label className="text-xs font-medium whitespace-nowrap">Litri *</label>
                <input type="number" step="0.01" name="liters" defaultValue={item.liters} required className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
              </div>
              <div className="flex flex-col gap-1.5 flex-1 min-w-0 w-full">
                <label className="text-xs font-medium whitespace-nowrap">Costo Totale (€) *</label>
                <input type="number" step="0.01" name="costEur" defaultValue={item.costEur} required className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex flex-col gap-1.5 flex-1 min-w-0 w-full">
                <label className="text-xs font-medium whitespace-nowrap">Tipo Carburante *</label>
                <select name="fuelType" defaultValue={vehicleFuelType || item.fuelType} className="w-full rounded-md border bg-background px-3 py-2 text-sm" required>
                  <option value="DIESEL">Diesel</option>
                  <option value="GASOLINE">Benzina</option>
                  <option value="ELECTRIC">Elettrico</option>
                  <option value="HYBRID">Ibrido</option>
                  <option value="LPG">GPL</option>
                  <option value="CNG">Metano</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5 flex-1 min-w-0 w-full">
                <label className="text-xs font-medium whitespace-nowrap">Stazione</label>
                <input type="text" name="station" defaultValue={item.station || ""} className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex flex-col gap-1.5 flex-1 min-w-0 w-full">
                <label className="text-xs font-medium whitespace-nowrap">Note</label>
                <input type="text" name="notes" defaultValue={item.notes || ""} className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
              </div>
              <div className="flex flex-col gap-1.5 flex-1 min-w-0 w-full">
                <label className="text-xs font-medium whitespace-nowrap">Pieno</label>
                <label className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm">
                  <input type="checkbox" name="fullTank" value="true" defaultChecked={item.fullTank} className="h-4 w-4" />
                  Serbatoio pieno
                </label>
              </div>
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
