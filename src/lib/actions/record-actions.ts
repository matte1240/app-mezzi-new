"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-utils";
import { mileageSchema, refuelingSchema, maintenanceSchema } from "@/lib/validators";
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

  revalidatePath(`/mezzi/${parsed.data.vehicleId}`);
  revalidatePath("/interventi");
  revalidatePath("/chilometraggi");
  return { success: true };
}
