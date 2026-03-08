import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendDeadlineReminder } from "@/lib/email";

const deadlineTypeLabels: Record<string, string> = {
  TAGLIANDO: "Tagliando",
  REVISIONE: "Revisione",
  ASSICURAZIONE: "Assicurazione",
  BOLLO: "Bollo",
  REVISIONE_TACHIGRAFO: "Rev. Tachigrafo",
  ALTRO: "Altro",
};

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deadlines = await prisma.deadline.findMany({
    where: { completed: false },
    include: {
      vehicle: { select: { plate: true, brand: true, model: true } },
    },
  });

  const admins = await prisma.user.findMany({
    where: {
      role: { in: ["ADMIN", "FLEET_MANAGER"] },
      active: true,
    },
    select: { email: true },
  });

  if (admins.length === 0) {
    return NextResponse.json({ message: "No recipients" });
  }

  const now = new Date();
  let sent = 0;

  for (const deadline of deadlines) {
    const dueDate = new Date(deadline.dueDate);
    const diffMs = dueDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (daysRemaining <= deadline.reminderDays) {
      for (const admin of admins) {
        try {
          await sendDeadlineReminder({
            to: admin.email,
            vehiclePlate: `${deadline.vehicle.plate} (${deadline.vehicle.brand} ${deadline.vehicle.model})`,
            deadlineType: deadlineTypeLabels[deadline.type] || deadline.type,
            dueDate,
            daysRemaining,
          });
          sent++;
        } catch (err) {
          console.error(
            `Failed to send email to ${admin.email} for deadline ${deadline.id}:`,
            err
          );
        }
      }
    }
  }

  return NextResponse.json({
    message: `Processed ${deadlines.length} deadlines, sent ${sent} emails`,
  });
}
