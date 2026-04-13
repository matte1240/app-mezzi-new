"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser, canManageDeadlines, canEditDeleteEntries } from "@/lib/auth-utils";
import { plannedMaintenanceSchema, maintenanceSchema, plannedMaintenanceUpdateSchema } from "@/lib/validators";
import { syncRevisioneDeadline, syncTagliandoDeadline } from "@/lib/auto-deadlines";
import { revalidatePath } from "next/cache";

async function validateKm(vehicleId: string, newKm: number) {
  const lastReading = await prisma.mileageReading.findFirst({
    where: { vehicleId },
    orderBy: { km: "desc" },
    select: { km: true },
  });

  if (lastReading && newKm < lastReading.km) {
    return `Km (${newKm}) inferiore all'ultimo rilevamento (${lastReading.km} km)`;
  }

  return null;
}

export async function createPlannedMaintenance(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  const user = await getSessionUser();
  if (!canManageDeadlines(user.role)) {
    return { error: "Non autorizzato" };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = plannedMaintenanceSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // Verify user exists in DB (JWT may be from a different DB instance)
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) {
    return { error: "Sessione non valida. Effettua nuovamente il login." };
  }

  if (parsed.data.sourceDeadlineId) {
    const existingDeadlinePlan = await prisma.plannedMaintenance.findFirst({
      where: {
        sourceDeadlineId: parsed.data.sourceDeadlineId,
        status: "PLANNED",
      },
    });
    if (existingDeadlinePlan) {
      return { error: "Esiste gia un intervento pianificato per questa scadenza" };
    }
  }

  if (parsed.data.sourceTripAnomalyId) {
    const existingAnomalyPlan = await prisma.plannedMaintenance.findFirst({
      where: {
        sourceTripAnomalyId: parsed.data.sourceTripAnomalyId,
        status: "PLANNED",
      },
    });
    if (existingAnomalyPlan) {
      return { error: "Esiste gia un intervento pianificato per questa segnalazione" };
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.plannedMaintenance.create({
      data: {
        ...parsed.data,
        createdById: user.id,
      },
    });

    if (parsed.data.sourceTripAnomalyId) {
      await tx.tripAnomaly.updateMany({
        where: {
          id: parsed.data.sourceTripAnomalyId,
          status: "OPEN",
        },
        data: {
          status: "IN_REVIEW",
        },
      });
    }
  });

  revalidatePath("/interventi");
  revalidatePath("/segnalazioni");
  if (parsed.data.sourceTripAnomalyId) {
    revalidatePath(`/segnalazioni/${parsed.data.sourceTripAnomalyId}`);
  }
  return { success: true };
}

export async function updatePlannedMaintenanceStatus(
  id: string,
  status: "COMPLETED" | "CANCELLED"
) {
  const user = await getSessionUser();
  if (!canEditDeleteEntries(user.role)) {
    return { error: "Non autorizzato" };
  }

  const item = await prisma.plannedMaintenance.findUnique({ where: { id } });
  if (!item) return { error: "Intervento pianificato non trovato" };

  await prisma.plannedMaintenance.update({
    where: { id },
    data: { status },
  });

  revalidatePath("/interventi");
  return { success: true };
}

export async function deletePlannedMaintenance(id: string) {
  const user = await getSessionUser();
  if (!canEditDeleteEntries(user.role)) {
    return { error: "Non autorizzato" };
  }

  await prisma.plannedMaintenance.delete({ where: { id } });

  revalidatePath("/interventi");
  return { success: true };
}

export async function updatePlannedMaintenance(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  const user = await getSessionUser();
  if (!canEditDeleteEntries(user.role)) {
    return { error: "Non autorizzato" };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = plannedMaintenanceUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const existing = await prisma.plannedMaintenance.findUnique({
    where: { id: parsed.data.plannedMaintenanceId },
    select: { id: true, vehicleId: true },
  });

  if (!existing) {
    return { error: "Intervento pianificato non trovato" };
  }

  await prisma.plannedMaintenance.update({
    where: { id: existing.id },
    data: {
      type: parsed.data.type,
      scheduledDate: parsed.data.scheduledDate,
      description: parsed.data.description,
      garage: parsed.data.garage || null,
      notes: parsed.data.notes || null,
    },
  });

  revalidatePath("/interventi");
  revalidatePath("/");
  revalidatePath(`/mezzi/${existing.vehicleId}`);
  return { success: true };
}

const deadlineToMaintenanceType: Record<string, string> = {
  TAGLIANDO: "TAGLIANDO",
  REVISIONE: "REVISIONE",
  ASSICURAZIONE: "ALTRO",
  BOLLO: "ALTRO",
  REVISIONE_TACHIGRAFO: "ALTRO",
  ALTRO: "ALTRO",
};

const anomalyToMaintenanceType: Record<string, "TAGLIANDO" | "REVISIONE" | "RIPARAZIONE" | "CAMBIO_GOMME" | "ALTRO"> = {
  LONG_DURATION: "ALTRO",
  EXCESSIVE_DISTANCE: "ALTRO",
  HIGH_AVERAGE_SPEED: "ALTRO",
  KM_INVARIATO: "ALTRO",
  MANUAL: "RIPARAZIONE",
};

export async function createPlannedMaintenanceFromTripAnomaly(
  _prevState: { error?: string; success?: string } | undefined,
  formData: FormData
) {
  const user = await getSessionUser();
  if (!canManageDeadlines(user.role)) {
    return { error: "Non autorizzato" };
  }

  const anomalyId = (formData.get("anomalyId") as string | null)?.trim();
  if (!anomalyId) {
    return { error: "Segnalazione non valida" };
  }

  const scheduledDateRaw = formData.get("scheduledDate");
  let scheduledDate = new Date();
  scheduledDate.setHours(0, 0, 0, 0);
  if (typeof scheduledDateRaw === "string" && scheduledDateRaw.trim() !== "") {
    const parsedDate = new Date(scheduledDateRaw);
    if (Number.isNaN(parsedDate.getTime())) {
      return { error: "Data pianificazione non valida" };
    }
    parsedDate.setHours(0, 0, 0, 0);
    scheduledDate = parsedDate;
  }

  const garageRaw = formData.get("garage");
  const garage =
    typeof garageRaw === "string" && garageRaw.trim() !== ""
      ? garageRaw.trim()
      : null;

  const anomaly = await prisma.tripAnomaly.findUnique({
    where: { id: anomalyId },
    include: {
      trip: {
        include: {
          vehicle: { select: { plate: true } },
        },
      },
    },
  });

  if (!anomaly) {
    return { error: "Segnalazione non trovata" };
  }

  if (anomaly.status === "RESOLVED") {
    return { error: "La segnalazione e gia risolta" };
  }

  const existingPlan = await prisma.plannedMaintenance.findFirst({
    where: {
      sourceTripAnomalyId: anomaly.id,
      status: "PLANNED",
    },
  });

  if (existingPlan) {
    return { error: "Esiste gia un intervento pianificato per questa segnalazione" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.plannedMaintenance.create({
      data: {
        vehicleId: anomaly.trip.vehicleId,
        createdById: user.id,
        type: anomalyToMaintenanceType[anomaly.type] ?? "ALTRO",
        scheduledDate,
        description: `Da segnalazione ${anomaly.trip.vehicle.plate}: ${anomaly.message}`,
        garage,
        sourceTripAnomalyId: anomaly.id,
      },
    });

    if (anomaly.status === "OPEN") {
      await tx.tripAnomaly.update({
        where: { id: anomaly.id },
        data: { status: "IN_REVIEW" },
      });
    }
  });

  revalidatePath("/segnalazioni");
  revalidatePath(`/segnalazioni/${anomaly.id}`);
  revalidatePath("/interventi");
  revalidatePath("/");

  return { success: "Intervento pianificato dalla segnalazione" };
}

export async function planFromDeadline(deadlineId: string) {
  const user = await getSessionUser();
  if (!canManageDeadlines(user.role)) {
    return { error: "Non autorizzato" };
  }

  const deadline = await prisma.deadline.findUnique({
    where: { id: deadlineId },
    include: { vehicle: true },
  });
  if (!deadline) return { error: "Scadenza non trovata" };

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) {
    return { error: "Sessione non valida. Effettua nuovamente il login." };
  }

  const existingPlan = await prisma.plannedMaintenance.findFirst({
    where: {
      sourceDeadlineId: deadline.id,
      status: "PLANNED",
    },
  });

  if (existingPlan) {
    return { error: "Esiste gia un intervento pianificato per questa scadenza" };
  }

  await prisma.plannedMaintenance.create({
    data: {
      vehicleId: deadline.vehicleId,
      createdById: user.id,
      type: (deadlineToMaintenanceType[deadline.type] || "ALTRO") as "TAGLIANDO" | "REVISIONE" | "RIPARAZIONE" | "CAMBIO_GOMME" | "ALTRO",
      scheduledDate: deadline.dueDate,
      description: deadline.description || `${deadline.type} — ${deadline.vehicle.plate}`,
      sourceDeadlineId: deadline.id,
    },
  });

  revalidatePath("/interventi");
  revalidatePath("/scadenze");
  return { success: true };
}


export async function completePlannedMaintenance(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  const user = await getSessionUser();
  if (!canEditDeleteEntries(user.role)) {
    return { error: "Non autorizzato" };
  }

  const plannedId = formData.get("plannedMaintenanceId") as string;
  const raw = Object.fromEntries(formData.entries());
  
  // Rimuovi plannedMaintenanceId altrimenti maintenanceSchema non valida
  delete raw.plannedMaintenanceId;
  
  const parsed = maintenanceSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const planned = await prisma.plannedMaintenance.findUnique({
    where: { id: plannedId }
  });
  
  if (!planned) {
    return { error: "Intervento pianificato non trovato" };
  }

  if (planned.vehicleId !== parsed.data.vehicleId) {
    return { error: "Il mezzo selezionato non corrisponde all'intervento pianificato" };
  }

  const kmError = await validateKm(parsed.data.vehicleId, parsed.data.km);
  if (kmError) {
    return { error: kmError };
  }

  const maintenance = await prisma.$transaction(async (tx) => {
    const createdMaintenance = await tx.maintenanceIntervention.create({
      data: {
        ...parsed.data,
        userId: user.id,
        sourceTripAnomalyId: planned.sourceTripAnomalyId,
      },
    });

    await tx.mileageReading.create({
      data: {
        vehicleId: parsed.data.vehicleId,
        recordedByUserId: user.id,
        km: parsed.data.km,
        date: parsed.data.date,
        source: "MAINTENANCE",
        notes: `Fine intervento pianificato (${plannedId})`,
      },
    });

    await tx.plannedMaintenance.update({
      where: { id: plannedId },
      data: { status: "COMPLETED" },
    });

    return createdMaintenance;
  });

  if (parsed.data.type === "TAGLIANDO") {
    await syncTagliandoDeadline(parsed.data.vehicleId, {
      performedAt: parsed.data.date,
      performedKm: parsed.data.km,
      completeExistingAuto: true,
    });
  } else if (parsed.data.type === "REVISIONE") {
    await syncRevisioneDeadline(parsed.data.vehicleId, {
      performedAt: parsed.data.date,
      completeExistingAuto: true,
    });
  }

  if (planned.sourceTripAnomalyId) {
    const linkedAnomaly = await prisma.tripAnomaly.findUnique({
      where: { id: planned.sourceTripAnomalyId },
      select: { id: true, status: true },
    });

    if (linkedAnomaly && linkedAnomaly.status !== "RESOLVED") {
      const maintenanceDateLabel = parsed.data.date.toLocaleDateString("it-IT");
      const fallbackResolutionNotes = `Risolta con intervento registrato il ${maintenanceDateLabel} (${parsed.data.km.toLocaleString("it-IT")} km).`;
      const resolutionNotes = parsed.data.notes?.trim() || parsed.data.description || fallbackResolutionNotes;

      await prisma.tripAnomaly.update({
        where: { id: linkedAnomaly.id },
        data: {
          status: "RESOLVED",
          resolvedAt: new Date(),
          resolvedByUserId: user.id,
          resolutionNotes,
        },
      });
    }

    revalidatePath("/segnalazioni");
    revalidatePath(`/segnalazioni/${planned.sourceTripAnomalyId}`);
  }

  revalidatePath("/interventi");
  revalidatePath(`/mezzi/${parsed.data.vehicleId}`);
  revalidatePath("/scadenze");
  revalidatePath("/");
  void maintenance;
  return { success: true };
}
