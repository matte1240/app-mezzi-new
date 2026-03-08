"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser, canManageVehicles, canManageUsers } from "@/lib/auth-utils";
import { vehicleSchema, userSchema } from "@/lib/validators";
import { generateAutoDeadlines } from "@/lib/auto-deadlines";
import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function onboardingCreateVehicle(
  _prevState: { error?: string; success?: boolean } | undefined,
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
  return { success: true };
}

export async function onboardingCreateUser(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  const currentUser = await getSessionUser();
  if (!canManageUsers(currentUser.role)) {
    return { error: "Non autorizzato" };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = userSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  if (!parsed.data.password) {
    return { error: "Password obbligatoria" };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) {
    return { error: "Email già registrata" };
  }

  const passwordHash = await hash(parsed.data.password, 12);
  await prisma.user.create({
    data: {
      email: parsed.data.email,
      name: parsed.data.name,
      role: parsed.data.role,
      active: parsed.data.active ?? true,
      passwordHash,
    },
  });

  revalidatePath("/utenti");
  return { success: true };
}
