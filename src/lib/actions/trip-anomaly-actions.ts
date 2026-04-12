"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser, canManageTripAnomalies } from "@/lib/auth-utils";
import { tripAnomalyStatusUpdateSchema } from "@/lib/validators";
import { revalidatePath } from "next/cache";

type ActionState = {
  error?: string;
  success?: string;
};

const anomalyStatusLabels: Record<string, string> = {
  OPEN: "Aperta",
  IN_REVIEW: "In lavorazione",
  RESOLVED: "Risolta",
};

export async function updateTripAnomalyStatus(
  _prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const user = await getSessionUser();
  if (!canManageTripAnomalies(user.role)) {
    return { error: "Non autorizzato" };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = tripAnomalyStatusUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const anomaly = await prisma.tripAnomaly.findUnique({
    where: { id: parsed.data.anomalyId },
    select: { id: true },
  });

  if (!anomaly) {
    return { error: "Segnalazione non trovata" };
  }

  const markAsResolved = parsed.data.status === "RESOLVED";

  await prisma.tripAnomaly.update({
    where: { id: anomaly.id },
    data: {
      status: parsed.data.status,
      resolutionNotes: parsed.data.resolutionNotes || null,
      resolvedAt: markAsResolved ? new Date() : null,
      resolvedByUserId: markAsResolved ? user.id : null,
    },
  });

  revalidatePath("/segnalazioni");
  revalidatePath(`/segnalazioni/${anomaly.id}`);
  revalidatePath("/viaggi");
  revalidatePath("/");

  return {
    success: `Segnalazione aggiornata: ${anomalyStatusLabels[parsed.data.status]}`,
  };
}
