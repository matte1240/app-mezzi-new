"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser, canEditDeleteEntries } from "@/lib/auth-utils";
import { tripAnomalyStatusUpdateSchema, tripAnomalyUpdateSchema } from "@/lib/validators";
import { revalidatePath } from "next/cache";
import { unlink } from "fs/promises";
import { deriveTripAnomalyThumbnailPath } from "@/lib/file-storage";

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
  if (!canEditDeleteEntries(user.role)) {
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

export async function updateTripAnomaly(
  _prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const user = await getSessionUser();
  if (!canEditDeleteEntries(user.role)) {
    return { error: "Non autorizzato" };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = tripAnomalyUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const anomaly = await prisma.tripAnomaly.findUnique({
    where: { id: parsed.data.anomalyId },
    select: {
      id: true,
      trip: {
        select: {
          vehicleId: true,
        },
      },
    },
  });

  if (!anomaly) {
    return { error: "Segnalazione non trovata" };
  }

  const markAsResolved = parsed.data.status === "RESOLVED";

  await prisma.tripAnomaly.update({
    where: { id: anomaly.id },
    data: {
      type: parsed.data.type,
      message: parsed.data.message,
      status: parsed.data.status,
      resolutionNotes: parsed.data.resolutionNotes || null,
      resolvedAt: markAsResolved ? new Date() : null,
      resolvedByUserId: markAsResolved ? user.id : null,
    },
  });

  revalidatePath("/segnalazioni");
  revalidatePath(`/segnalazioni/${anomaly.id}`);
  revalidatePath("/viaggi");
  revalidatePath(`/mezzi/${anomaly.trip.vehicleId}`);
  revalidatePath("/");

  return {
    success: `Segnalazione aggiornata: ${anomalyStatusLabels[parsed.data.status]}`,
  };
}

export async function deleteTripAnomaly(anomalyId: string): Promise<ActionState> {
  const user = await getSessionUser();
  if (!canEditDeleteEntries(user.role)) {
    return { error: "Non autorizzato" };
  }

  const anomaly = await prisma.tripAnomaly.findUnique({
    where: { id: anomalyId },
    select: {
      id: true,
      trip: {
        select: {
          vehicleId: true,
        },
      },
      photos: {
        select: {
          id: true,
          filePath: true,
        },
      },
    },
  });

  if (!anomaly) {
    return { error: "Segnalazione non trovata" };
  }

  for (const photo of anomaly.photos) {
    try {
      await unlink(photo.filePath);
    } catch {
      // File may already be missing.
    }

    const thumbnailPath = deriveTripAnomalyThumbnailPath(photo.filePath);
    if (thumbnailPath) {
      try {
        await unlink(thumbnailPath);
      } catch {
        // Thumbnail may already be missing.
      }
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.document.deleteMany({ where: { tripAnomalyId: anomaly.id } });
    await tx.tripAnomaly.delete({ where: { id: anomaly.id } });
  });

  revalidatePath("/segnalazioni");
  revalidatePath(`/segnalazioni/${anomaly.id}`);
  revalidatePath("/documenti");
  revalidatePath("/viaggi");
  revalidatePath(`/mezzi/${anomaly.trip.vehicleId}`);
  revalidatePath("/");

  return { success: "Segnalazione eliminata" };
}
