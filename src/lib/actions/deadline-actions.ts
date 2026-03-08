"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser, canManageDeadlines } from "@/lib/auth-utils";
import { deadlineSchema } from "@/lib/validators";
import { revalidatePath } from "next/cache";
import { generateNextDeadline } from "@/lib/auto-deadlines";

export async function createDeadline(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  const user = await getSessionUser();
  if (!canManageDeadlines(user.role)) {
    return { error: "Non autorizzato" };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = deadlineSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await prisma.deadline.create({ data: parsed.data });

  revalidatePath(`/mezzi/${parsed.data.vehicleId}`);
  revalidatePath("/scadenze");
  return { success: true };
}

export async function toggleDeadlineComplete(deadlineId: string) {
  const user = await getSessionUser();
  if (!canManageDeadlines(user.role)) {
    return { error: "Non autorizzato" };
  }

  const deadline = await prisma.deadline.findUnique({
    where: { id: deadlineId },
  });
  if (!deadline) return { error: "Scadenza non trovata" };

  await prisma.deadline.update({
    where: { id: deadlineId },
    data: {
      completed: !deadline.completed,
      completedDate: !deadline.completed ? new Date() : null,
    },
  });

  // When completing a deadline, automatically generate the next one
  if (!deadline.completed) {
    await generateNextDeadline(deadlineId);
  }

  revalidatePath(`/mezzi/${deadline.vehicleId}`);
  revalidatePath("/scadenze");
  revalidatePath("/");
}

export async function deleteDeadline(deadlineId: string) {
  const user = await getSessionUser();
  if (!canManageDeadlines(user.role)) {
    return { error: "Non autorizzato" };
  }

  const deadline = await prisma.deadline.findUnique({
    where: { id: deadlineId },
  });
  if (!deadline) return { error: "Scadenza non trovata" };

  await prisma.deadline.delete({ where: { id: deadlineId } });

  revalidatePath(`/mezzi/${deadline.vehicleId}`);
  revalidatePath("/scadenze");
  revalidatePath("/");
}
