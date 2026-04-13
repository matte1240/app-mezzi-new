"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Wrench, CalendarDays, CheckCircle2 } from "lucide-react";
import { SubmitButton } from "@/components/ui/submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createPlannedMaintenanceFromTripAnomaly } from "@/lib/actions/planned-maintenance-actions";
import {
  plannedMaintenanceStatusColors,
  plannedMaintenanceStatusLabels,
} from "@/lib/labels";

type LinkedPlannedMaintenanceItem = {
  id: string;
  status: "PLANNED" | "COMPLETED" | "CANCELLED";
  scheduledDate: string;
  description: string;
  vehicleId: string;
  vehiclePlate: string;
};

type LinkedMaintenanceItem = {
  id: string;
  date: string;
  km: number;
  description: string;
};

type ActionState = {
  error?: string;
  success?: string;
};

const initialState: ActionState = {
  error: "",
  success: "",
};

export function TripAnomalyMaintenanceCard({
  anomalyId,
  currentStatus,
  canManage,
  linkedPlanned,
  linkedMaintenance,
}: {
  anomalyId: string;
  currentStatus: "OPEN" | "IN_REVIEW" | "RESOLVED";
  canManage: boolean;
  linkedPlanned: LinkedPlannedMaintenanceItem[];
  linkedMaintenance: LinkedMaintenanceItem[];
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(
    createPlannedMaintenanceFromTripAnomaly,
    initialState
  );

  useEffect(() => {
    if (state?.success) {
      router.refresh();
    }
  }, [state?.success, router]);

  const hasOpenPlan = linkedPlanned.some((item) => item.status === "PLANNED");
  const planningDisabled = currentStatus === "RESOLVED" || hasOpenPlan;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Interventi collegati</h3>
        <p className="text-xs text-muted-foreground">
          Collega la segnalazione a un intervento pianificato per tenere traccia della risoluzione.
        </p>
      </div>

      {canManage ? (
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="anomalyId" value={anomalyId} />
          <SubmitButton
            pendingText="Pianificazione..."
            type="submit"
            disabled={planningDisabled}
            className="w-full"
          >
            <Wrench className="mr-2 h-4 w-4" />
            {hasOpenPlan
              ? "Intervento gia pianificato"
              : currentStatus === "RESOLVED"
                ? "Segnalazione gia risolta"
                : "Pianifica intervento da segnalazione"}
          </SubmitButton>
          {state?.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
          {state?.success ? (
            <p className="text-sm text-green-700">{state.success}</p>
          ) : null}
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          Solo amministratori e fleet manager possono pianificare interventi.
        </p>
      )}

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Pianificati</p>
        {linkedPlanned.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nessun intervento pianificato collegato.</p>
        ) : (
          <div className="space-y-2">
            {linkedPlanned.map((item) => (
              <div key={item.id} className="rounded-md border p-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={plannedMaintenanceStatusColors[item.status] || ""}>
                    {plannedMaintenanceStatusLabels[item.status] || item.status}
                  </Badge>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {new Date(item.scheduledDate).toLocaleDateString("it-IT")}
                  </span>
                </div>
                <p className="mt-1 text-sm">{item.description}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Link href={`/mezzi/${item.vehicleId}`}>
                    <Button type="button" variant="outline" size="sm" className="h-7 text-xs">
                      Mezzo {item.vehiclePlate}
                    </Button>
                  </Link>
                  <Link href="/interventi">
                    <Button type="button" variant="outline" size="sm" className="h-7 text-xs">
                      Apri interventi
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Eseguiti</p>
        {linkedMaintenance.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nessun intervento eseguito collegato.</p>
        ) : (
          <div className="space-y-2">
            {linkedMaintenance.map((item) => (
              <div key={item.id} className="rounded-md border p-2">
                <div className="inline-flex items-center gap-1 text-xs text-green-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {new Date(item.date).toLocaleDateString("it-IT")} · {item.km.toLocaleString("it-IT")} km
                </div>
                <p className="mt-1 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
