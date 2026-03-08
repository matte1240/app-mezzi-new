"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser, canManageUsers } from "@/lib/auth-utils";
import { userSchema } from "@/lib/validators";
import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function createUser(
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
    return { error: "Password obbligatoria per nuovo utente" };
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
      active: parsed.data.active,
      passwordHash,
    },
  });

  revalidatePath("/utenti");
  return { success: true };
}

export async function updateUser(
  userId: string,
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

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing && existing.id !== userId) {
    return { error: "Email già in uso da un altro utente" };
  }

  const data: Record<string, unknown> = {
    email: parsed.data.email,
    name: parsed.data.name,
    role: parsed.data.role,
    active: parsed.data.active,
  };

  if (parsed.data.password) {
    data.passwordHash = await hash(parsed.data.password, 12);
  }

  await prisma.user.update({ where: { id: userId }, data });

  revalidatePath("/utenti");
  return { success: true };
}

export async function deleteUser(userId: string) {
  const currentUser = await getSessionUser();
  if (!canManageUsers(currentUser.role)) {
    return { error: "Non autorizzato" };
  }

  if (userId === currentUser.id) {
    return { error: "Non puoi eliminare il tuo account" };
  }

  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/utenti");
}
