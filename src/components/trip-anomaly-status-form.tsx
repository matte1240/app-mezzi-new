"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SubmitButton } from "@/components/ui/submit-button";
import { updateTripAnomaly } from "@/lib/actions/trip-anomaly-actions";
import { tripAnomalyTypeLabels } from "@/lib/labels";

type ActionState = {
  error?: string;
  success?: string;
};

const initialState: ActionState = {
  error: "",
  success: "",
};

export function TripAnomalyStatusForm({
  anomalyId,
  currentType,
  currentStatus,
  currentMessage,
  initialResolutionNotes,
}: {
  anomalyId: string;
  currentType: string;
  currentStatus: "OPEN" | "IN_REVIEW" | "RESOLVED";
  currentMessage: string;
  initialResolutionNotes: string | null;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(updateTripAnomaly, initialState);

  useEffect(() => {
    if (state?.success) {
      router.refresh();
    }
  }, [state?.success, router]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="anomalyId" value={anomalyId} />

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Tipo segnalazione</label>
        <select
          name="type"
          defaultValue={currentType}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          required
        >
          <option value="MANUAL">{tripAnomalyTypeLabels.MANUAL}</option>
          <option value="LONG_DURATION">{tripAnomalyTypeLabels.LONG_DURATION}</option>
          <option value="EXCESSIVE_DISTANCE">{tripAnomalyTypeLabels.EXCESSIVE_DISTANCE}</option>
          <option value="HIGH_AVERAGE_SPEED">{tripAnomalyTypeLabels.HIGH_AVERAGE_SPEED}</option>
          <option value="KM_INVARIATO">{tripAnomalyTypeLabels.KM_INVARIATO}</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Messaggio segnalazione</label>
        <textarea
          name="message"
          defaultValue={currentMessage}
          rows={4}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          required
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Stato segnalazione</label>
        <select
          name="status"
          defaultValue={currentStatus}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          required
        >
          <option value="OPEN">Aperta</option>
          <option value="IN_REVIEW">In lavorazione</option>
          <option value="RESOLVED">Risolta</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Note risoluzione</label>
        <textarea
          name="resolutionNotes"
          defaultValue={initialResolutionNotes || ""}
          rows={4}
          placeholder="Annota interventi, decisioni o chiusura della segnalazione"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>

      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state?.success ? <p className="text-sm text-green-700">{state.success}</p> : null}

      <SubmitButton pendingText="Aggiornamento...">Aggiorna stato</SubmitButton>
    </form>
  );
}
