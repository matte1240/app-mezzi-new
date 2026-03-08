"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type VehicleFormProps = {
  action: (
    prevState: { error?: string } | undefined,
    formData: FormData
  ) => Promise<{ error?: string } | undefined>;
  defaultValues?: {
    plate?: string;
    brand?: string;
    model?: string;
    year?: number;
    vin?: string | null;
    fuelType?: string;
    ownershipType?: string;
    status?: string;
    registrationDate?: Date | string | null;
    maintenanceIntervalMonths?: number | null;
    maintenanceIntervalKm?: number | null;
    assignedDriverId?: string | null;
    notes?: string | null;
  };
  drivers: { id: string; name: string }[];
  submitLabel: string;
};

export function VehicleForm({
  action,
  defaultValues,
  drivers,
  submitLabel,
}: VehicleFormProps) {
  const [state, formAction] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-6 max-w-2xl">
      {state?.error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="plate">Targa *</Label>
          <Input
            id="plate"
            name="plate"
            defaultValue={defaultValues?.plate || ""}
            placeholder="AA000BB"
            required
            className="uppercase"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vin">Telaio (VIN)</Label>
          <Input
            id="vin"
            name="vin"
            defaultValue={defaultValues?.vin || ""}
            placeholder="Opzionale"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="brand">Marca *</Label>
          <Input
            id="brand"
            name="brand"
            defaultValue={defaultValues?.brand || ""}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="model">Modello *</Label>
          <Input
            id="model"
            name="model"
            defaultValue={defaultValues?.model || ""}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="year">Anno *</Label>
          <Input
            id="year"
            name="year"
            type="number"
            defaultValue={defaultValues?.year || new Date().getFullYear()}
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="fuelType">Carburante *</Label>
          <select
            id="fuelType"
            name="fuelType"
            defaultValue={defaultValues?.fuelType || "DIESEL"}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            required
          >
            <option value="DIESEL">Diesel</option>
            <option value="GASOLINE">Benzina</option>
            <option value="ELECTRIC">Elettrico</option>
            <option value="HYBRID">Ibrido</option>
            <option value="LPG">GPL</option>
            <option value="CNG">Metano</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="ownershipType">Tipo Proprietà *</Label>
          <select
            id="ownershipType"
            name="ownershipType"
            defaultValue={defaultValues?.ownershipType || "OWNED"}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            required
          >
            <option value="OWNED">Proprietà</option>
            <option value="RENTED">Noleggio</option>
            <option value="LEASED">Leasing</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Stato *</Label>
          <select
            id="status"
            name="status"
            defaultValue={defaultValues?.status || "ACTIVE"}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            required
          >
            <option value="ACTIVE">Attivo</option>
            <option value="INACTIVE">Inattivo</option>
            <option value="MAINTENANCE">In manutenzione</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="registrationDate">Data Immatricolazione</Label>
          <Input
            id="registrationDate"
            name="registrationDate"
            type="date"
            defaultValue={
              defaultValues?.registrationDate
                ? new Date(defaultValues.registrationDate).toISOString().split("T")[0]
                : ""
            }
          />
          <p className="text-xs text-muted-foreground">
            Usata per calcolo revisioni automatiche
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="maintenanceIntervalMonths">Intervallo Tagliando (mesi)</Label>
          <Input
            id="maintenanceIntervalMonths"
            name="maintenanceIntervalMonths"
            type="number"
            min={1}
            max={120}
            defaultValue={defaultValues?.maintenanceIntervalMonths ?? 12}
            placeholder="12"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maintenanceIntervalKm">Intervallo Tagliando (km)</Label>
          <Input
            id="maintenanceIntervalKm"
            name="maintenanceIntervalKm"
            type="number"
            min={1000}
            max={200000}
            step={1000}
            defaultValue={defaultValues?.maintenanceIntervalKm ?? ""}
            placeholder="15000"
          />
          <p className="text-xs text-muted-foreground">
            Opzionale, come promemoria
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="assignedDriverId">Autista Assegnato</Label>
        <select
          id="assignedDriverId"
          name="assignedDriverId"
          defaultValue={defaultValues?.assignedDriverId || ""}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="">Pool (non assegnato)</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Note</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={defaultValues?.notes || ""}
          rows={3}
        />
      </div>

      <SubmitButton pendingText="Salvataggio...">
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
