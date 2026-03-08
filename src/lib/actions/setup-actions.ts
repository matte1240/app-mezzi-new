"use server";

import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { z } from "zod";

const setupSchema = z.object({
  email: z.string().email("Email non valida"),
  name: z.string().min(1, "Nome obbligatorio"),
  password: z.string().min(6, "Password minimo 6 caratteri"),
});

export async function setupAdminAction(
  _prevState: { error?: string; success?: string } | undefined,
  formData: FormData
) {
  // Only allow setup when no users exist
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    return { error: "Setup già completato. Accedi con le tue credenziali." };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = setupSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const passwordHash = await hash(parsed.data.password, 12);
  await prisma.user.create({
    data: {
      email: parsed.data.email,
      name: parsed.data.name,
      role: "ADMIN",
      active: true,
      passwordHash,
    },
  });

  return { success: "Account admin creato! Ora puoi accedere." };
}

export async function checkNeedsSetup(): Promise<boolean> {
  const userCount = await prisma.user.count();
  return userCount === 0;
}
