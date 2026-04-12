"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser, canManageDeadlines } from "@/lib/auth-utils";
import { plannedMaintenanceSchema, maintenanceSchema } from "@/lib/validators";
import { syncRevisioneDeadline, syncTagliandoDeadline } from "@/lib/auto-deadlines";
import { revalidatePath } from "next/cache";

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

  await prisma.plannedMaintenance.create({
    data: {
      ...parsed.data,
      createdById: user.id,
    },
  });

  revalidatePath("/interventi");
  return { success: true };
}

export async function updatePlannedMaintenanceStatus(
  id: string,
  status: "COMPLETED" | "CANCELLED"
) {
  const user = await getSessionUser();
  if (!canManageDeadlines(user.role)) {
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
  if (!canManageDeadlines(user.role)) {
    return { error: "Non autorizzato" };
  }

  await prisma.plannedMaintenance.delete({ where: { id } });

  revalidatePath("/interventi");
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

  await prisma.plannedMaintenance.create({
    data: {
      vehicleId: deadline.vehicleId,
      createdById: user.id,
      type: (deadlineToMaintenanceType[deadline.type] || "ALTRO") as "TAGLIANDO" | "REVISIONE" | "RIPARAZIONE" | "CAMBIO_GOMME" | "ALTRO",
      scheduledDate: deadline.dueDate,
      description: deadline.description || `${deadline.type} — ${deadline.vehicle.plate}`,
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
  if (!canManageDeadlines(user.role)) {
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

  // Create maintenance and update planned status
  await prisma.$transaction([
    prisma.maintenanceIntervention.create({
      data: {
        ...parsed.data,
        userId: user.id,
      },
    }),
    prisma.plannedMaintenance.update({
      where: { id: plannedId },
      data: { status: "COMPLETED" },
    }),
  ]);

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

  revalidatePath("/interventi");
  revalidatePath(`/mezzi/${parsed.data.vehicleId}`);
  revalidatePath("/scadenze");
  revalidatePath("/");
  return { success: true };
}
