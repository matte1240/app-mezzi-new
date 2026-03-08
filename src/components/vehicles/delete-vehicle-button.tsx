"use client";

import { deleteVehicle } from "@/lib/actions/vehicle-actions";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function DeleteVehicleButton({
  vehicleId,
  plate,
}: {
  vehicleId: string;
  plate: string;
}) {
  return (
    <form
      action={async () => {
        if (confirm(`Eliminare definitivamente il mezzo ${plate}? Tutti i dati associati verranno persi.`)) {
          await deleteVehicle(vehicleId);
        }
      }}
    >
      <Button variant="destructive" size="sm">
        <Trash2 className="mr-2 h-4 w-4" />
        Elimina
      </Button>
    </form>
  );
}
