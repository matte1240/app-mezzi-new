"use server";

import { prisma } from "@/lib/prisma";
import { canManageVehicles, getSessionUser } from "@/lib/auth-utils";
import { mileageSchema, refuelingSchema, maintenanceSchema } from "@/lib/validators";
import { syncRevisioneDeadline, syncTagliandoDeadline } from "@/lib/auto-deadlines";
import { revalidatePath } from "next/cache";

async function validateKm(vehicleId: string, newKm: number) {
  const lastReading = await prisma.mileageReading.findFirst({
    where: { vehicleId },
    orderBy: { km: "desc" },
  });
  if (lastReading && newKm < lastReading.km) {
    return `Km (${newKm}) inferiore all'ultimo rilevamento (${lastReading.km} km)`;
  }
  return null;
}

export async function createMileageReading(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  const user = await getSessionUser();
  const raw = Object.fromEntries(formData.entries());
  const parsed = mileageSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const kmError = await validateKm(parsed.data.vehicleId, parsed.data.km);
  if (kmError) return { error: kmError };

  await prisma.mileageReading.create({
    data: {
      ...parsed.data,
      recordedByUserId: user.id,
    },
  });

  revalidatePath(`/mezzi/${parsed.data.vehicleId}`);
  revalidatePath("/chilometraggi");
  return { success: true };
}

export async function createRefueling(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  const user = await getSessionUser();
  const raw = Object.fromEntries(formData.entries());
  const parsed = refuelingSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const kmError = await validateKm(parsed.data.vehicleId, parsed.data.km);
  if (kmError) return { error: kmError };

  await prisma.$transaction([
    prisma.refueling.create({
      data: {
        ...parsed.data,
        userId: user.id,
      },
    }),
    prisma.mileageReading.create({
      data: {
        vehicleId: parsed.data.vehicleId,
        recordedByUserId: user.id,
        km: parsed.data.km,
        date: parsed.data.date,
        source: "REFUEL",
      },
    }),
  ]);

  revalidatePath(`/mezzi/${parsed.data.vehicleId}`);
  revalidatePath("/rifornimenti");
  revalidatePath("/chilometraggi");
  return { success: true };
}

export async function createMaintenance(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  const user = await getSessionUser();
  const raw = Object.fromEntries(formData.entries());
  const parsed = maintenanceSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const kmError = await validateKm(parsed.data.vehicleId, parsed.data.km);
  if (kmError) return { error: kmError };

  await prisma.$transaction([
    prisma.maintenanceIntervention.create({
      data: {
        ...parsed.data,
        userId: user.id,
      },
    }),
    prisma.mileageReading.create({
      data: {
        vehicleId: parsed.data.vehicleId,
        recordedByUserId: user.id,
        km: parsed.data.km,
        date: parsed.data.date,
        source: "MAINTENANCE",
      },
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

  revalidatePath(`/mezzi/${parsed.data.vehicleId}`);
  revalidatePath("/interventi");
  revalidatePath("/chilometraggi");
  revalidatePath("/scadenze");
  revalidatePath("/");
  return { success: true };
}

export async function deleteRecord(type: 'mileage' | 'refueling' | 'maintenance', id: string, vehicleId: string) {
  const user = await getSessionUser();
  if (user.role !== "ADMIN" && user.role !== "FLEET_MANAGER") {
    return { error: "Non autorizzato" };
  }
  
  if (type === 'mileage') {
    await prisma.mileageReading.delete({ where: { id } });
  } else if (type === 'refueling') {
    await prisma.refueling.delete({ where: { id } });
  } else if (type === 'maintenance') {
    const existingMaintenance = await prisma.maintenanceIntervention.findUnique({
      where: { id },
      select: { type: true },
    });

    await prisma.maintenanceIntervention.delete({ where: { id } });

    if (existingMaintenance?.type === "TAGLIANDO") {
      await syncTagliandoDeadline(vehicleId, { completeExistingAuto: false });
    } else if (existingMaintenance?.type === "REVISIONE") {
      await syncRevisioneDeadline(vehicleId, { completeExistingAuto: false });
    }
  }

  revalidatePath(`/mezzi/${vehicleId}`);
  revalidatePath("/chilometraggi");
  revalidatePath("/rifornimenti");
  revalidatePath("/interventi");
  revalidatePath("/scadenze");
  revalidatePath("/");
  return { success: true };
}

export async function updateMileageReading(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  const user = await getSessionUser();
  if (!canManageVehicles(user.role)) {
    return { error: "Non autorizzato" };
  }

  const id = formData.get("id") as string;
  const raw = Object.fromEntries(formData.entries());
  const parsed = mileageSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await prisma.mileageReading.update({
    where: { id },
    data: parsed.data,
  });

  revalidatePath(`/mezzi/${parsed.data.vehicleId}`);
  revalidatePath("/chilometraggi");
  return { success: true };
}

export async function updateRefueling(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  const user = await getSessionUser();
  if (!canManageVehicles(user.role)) {
    return { error: "Non autorizzato" };
  }

  const id = formData.get("id") as string;
  const raw = Object.fromEntries(formData.entries());
  const parsed = refuelingSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await prisma.refueling.update({
    where: { id },
    data: parsed.data,
  });

  revalidatePath(`/mezzi/${parsed.data.vehicleId}`);
  revalidatePath("/rifornimenti");
  return { success: true };
}

export async function updateMaintenance(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  const user = await getSessionUser();
  if (!canManageVehicles(user.role)) {
    return { error: "Non autorizzato" };
  }

  const id = formData.get("id") as string;
  const raw = Object.fromEntries(formData.entries());
  const parsed = maintenanceSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await prisma.maintenanceIntervention.update({
    where: { id },
    data: parsed.data,
  });

  if (parsed.data.type === "TAGLIANDO") {
    await syncTagliandoDeadline(parsed.data.vehicleId, {
      performedAt: parsed.data.date,
      performedKm: parsed.data.km,
      completeExistingAuto: false,
    });
  } else if (parsed.data.type === "REVISIONE") {
    await syncRevisioneDeadline(parsed.data.vehicleId, {
      performedAt: parsed.data.date,
      completeExistingAuto: false,
    });
  }

  revalidatePath(`/mezzi/${parsed.data.vehicleId}`);
  revalidatePath("/interventi");
  revalidatePath("/scadenze");
  revalidatePath("/");
  return { success: true };
}
