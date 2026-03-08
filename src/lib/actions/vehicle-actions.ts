"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser, canManageVehicles } from "@/lib/auth-utils";
import { vehicleSchema } from "@/lib/validators";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateAutoDeadlines } from "@/lib/auto-deadlines";

export async function createVehicle(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const user = await getSessionUser();
  if (!canManageVehicles(user.role)) {
    return { error: "Non autorizzato" };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = vehicleSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const existing = await prisma.vehicle.findUnique({
    where: { plate: parsed.data.plate },
  });
  if (existing) {
    return { error: "Targa già registrata" };
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      ...parsed.data,
      assignedDriverId: parsed.data.assignedDriverId || null,
      registrationDate: parsed.data.registrationDate || null,
      maintenanceIntervalMonths: parsed.data.maintenanceIntervalMonths || null,
      maintenanceIntervalKm: parsed.data.maintenanceIntervalKm || null,
    },
  });

  await generateAutoDeadlines(vehicle.id);

  revalidatePath("/mezzi");
  redirect(`/mezzi/${vehicle.id}`);
}

export async function updateVehicle(
  vehicleId: string,
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const user = await getSessionUser();
  if (!canManageVehicles(user.role)) {
    return { error: "Non autorizzato" };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = vehicleSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const existing = await prisma.vehicle.findUnique({
    where: { plate: parsed.data.plate },
  });
  if (existing && existing.id !== vehicleId) {
    return { error: "Targa già registrata su un altro mezzo" };
  }

  await prisma.vehicle.update({
    where: { id: vehicleId },
    data: {
      ...parsed.data,
      assignedDriverId: parsed.data.assignedDriverId || null,
      registrationDate: parsed.data.registrationDate || null,
      maintenanceIntervalMonths: parsed.data.maintenanceIntervalMonths || null,
      maintenanceIntervalKm: parsed.data.maintenanceIntervalKm || null,
    },
  });

  await generateAutoDeadlines(vehicleId);

  revalidatePath("/mezzi");
  revalidatePath(`/mezzi/${vehicleId}`);
  redirect(`/mezzi/${vehicleId}`);
}

export async function deleteVehicle(vehicleId: string) {
  const user = await getSessionUser();
  if (!canManageVehicles(user.role)) {
    return { error: "Non autorizzato" };
  }

  await prisma.vehicle.delete({ where: { id: vehicleId } });
  revalidatePath("/mezzi");
  redirect("/mezzi");
}
