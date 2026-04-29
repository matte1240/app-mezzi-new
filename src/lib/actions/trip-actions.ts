"use server";

import { prisma } from "@/lib/prisma";
import { canRecordTrips, canEditDeleteEntries, getSessionUser } from "@/lib/auth-utils";
import { tripStartSchema, tripStopSchema, tripUpdateSchema } from "@/lib/validators";
import {
  deriveTripAnomalyThumbnailPath,
} from "@/lib/file-storage";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { unlink } from "fs/promises";

function extractVehicleIdFromQr(raw: string): string | null {
  const value = raw.trim();
  if (!value || value === "manual-entry" || value.startsWith("manual:") || value.startsWith("auto-closed:")) {
    return null;
  }

  if (!value.includes("/") && !value.includes("?") && !value.includes("=")) {
    return value;
  }

  try {
    const url = new URL(value);
    const vehicleId = url.searchParams.get("vehicleId") || url.searchParams.get("v");
    return vehicleId || null;
  } catch {
    try {
      const url = new URL(value, "http://local");
      const vehicleId = url.searchParams.get("vehicleId") || url.searchParams.get("v");
      return vehicleId || null;
    } catch {
      return null;
    }
  }
}

function buildAutomaticAnomalies(distance: number, durationMinutes: number): Array<{ type: "LONG_DURATION" | "EXCESSIVE_DISTANCE" | "HIGH_AVERAGE_SPEED" | "KM_INVARIATO"; message: string }> {
  const anomalies: Array<{ type: "LONG_DURATION" | "EXCESSIVE_DISTANCE" | "HIGH_AVERAGE_SPEED" | "KM_INVARIATO"; message: string }> = [];

  if (durationMinutes > 10 * 60) {
    anomalies.push({
      type: "LONG_DURATION",
      message: `Durata elevata: ${Math.round(durationMinutes)} minuti`,
    });
  }

  if (distance > 900) {
    anomalies.push({
      type: "EXCESSIVE_DISTANCE",
      message: `Distanza elevata: ${distance} km`,
    });
  }

  if (distance === 0) {
    anomalies.push({
      type: "KM_INVARIATO",
      message: "Km iniziale e finale uguali",
    });
  }

  if (durationMinutes > 0 && distance > 0) {
    const avgSpeed = distance / (durationMinutes / 60);
    if (avgSpeed > 130) {
      anomalies.push({
        type: "HIGH_AVERAGE_SPEED",
        message: `Velocita media anomala: ${avgSpeed.toFixed(1)} km/h`,
      });
    }
  }

  return anomalies;
}

export async function startTrip(
  _prevState: { error?: string; success?: string } | undefined,
  formData: FormData
) {
  const user = await getSessionUser();
  if (!canRecordTrips(user.role)) {
    return { error: "Non autorizzato" };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = tripStartSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const startQrRaw = parsed.data.startQrRaw?.trim() || "";

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: parsed.data.vehicleId },
    select: { id: true, assignedDriverId: true, plate: true },
  });

  if (!vehicle) {
    return { error: "Mezzo non trovato" };
  }

  if (user.role === "DRIVER" && vehicle.assignedDriverId !== user.id) {
    return { error: "Puoi avviare viaggi solo sui mezzi assegnati" };
  }

  let autoClosedPlate = "";

  try {
    await prisma.$transaction(
      async (tx) => {
        const [existingOpenTrip, lastKm] = await Promise.all([
          tx.trip.findFirst({
            where: {
              vehicleId: vehicle.id,
              status: "OPEN",
            },
            select: { id: true, startKm: true, startTime: true, driverId: true, driver: { select: { name: true } } },
          }),
          tx.mileageReading.findFirst({
            where: { vehicleId: vehicle.id },
            orderBy: { km: "desc" },
            select: { km: true },
          }),
        ]);

        if (lastKm && parsed.data.startKm < lastKm.km) {
          throw new Error(`KM_TOO_LOW:${lastKm.km}`);
        }

        // Auto-close previous open trip on this vehicle using the new startKm
        if (existingOpenTrip) {
          const now = new Date();
          const durationMinutes = (now.getTime() - existingOpenTrip.startTime.getTime()) / (1000 * 60);
          const distance = parsed.data.startKm - existingOpenTrip.startKm;
          const autoAnomalies = buildAutomaticAnomalies(
            Math.max(distance, 0),
            durationMinutes
          );

          await tx.trip.update({
            where: { id: existingOpenTrip.id },
            data: {
              status: "COMPLETED",
              endTime: now,
              endKm: parsed.data.startKm,
              endQrRaw: `auto-closed:${vehicle.id}`,
              notes: "Chiuso automaticamente all'avvio di un nuovo viaggio",
            },
          });

          await tx.mileageReading.create({
            data: {
              vehicleId: vehicle.id,
              recordedByUserId: user.id,
              km: parsed.data.startKm,
              date: now,
              source: "TRIP",
              notes: `Chiusura automatica viaggio (${existingOpenTrip.driver?.name ?? "autista sconosciuto"})`,
            },
          });

          if (autoAnomalies.length > 0) {
            await tx.tripAnomaly.createMany({
              data: autoAnomalies.map((a) => ({
                tripId: existingOpenTrip.id,
                type: a.type,
                message: a.message,
                isManual: false,
                createdByUserId: user.id,
              })),
            });
          }

          autoClosedPlate = vehicle.plate;
        }

        await tx.trip.create({
          data: {
            vehicleId: vehicle.id,
            driverId: user.id,
            status: "OPEN",
            startTime: new Date(),
            startKm: parsed.data.startKm,
            startQrRaw: startQrRaw || `manual:${vehicle.id}`,
            notes: parsed.data.notes || null,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.startsWith("KM_TOO_LOW:")) {
        const km = error.message.split(":")[1];
        return { error: `Km iniziale inferiore all'ultimo rilevamento (${km} km)` };
      }
    }
    return { error: "Impossibile avviare il viaggio, riprova" };
  }

  revalidatePath("/viaggi");
  revalidatePath("/");
  const msg = autoClosedPlate
    ? `Viaggio avviato su ${vehicle.plate}. Il viaggio precedente e stato chiuso automaticamente.`
    : `Viaggio avviato su ${vehicle.plate}`;
  return { success: msg };
}

export async function stopTrip(
  _prevState: { error?: string; success?: string } | undefined,
  formData: FormData
) {
  const user = await getSessionUser();
  if (!canRecordTrips(user.role)) {
    return { error: "Non autorizzato" };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = tripStopSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const endQrRaw = parsed.data.endQrRaw?.trim() || "";
  const scannedVehicleId = endQrRaw ? extractVehicleIdFromQr(endQrRaw) : null;

  let anomalyCount = 0;
  let tripVehicleId = "";

  try {
    await prisma.$transaction(
      async (tx) => {
        const trip = await tx.trip.findUnique({
          where: { id: parsed.data.tripId },
          include: { vehicle: true },
        });

        if (!trip) {
          throw new Error("TRIP_NOT_FOUND");
        }

        tripVehicleId = trip.vehicleId;

        if (user.role === "DRIVER" && trip.driverId !== user.id) {
          throw new Error("NOT_OWNER");
        }

        if (scannedVehicleId && scannedVehicleId !== trip.vehicleId) {
          throw new Error("QR_MISMATCH");
        }

        if (parsed.data.endKm < trip.startKm) {
          throw new Error("END_KM_LT_START");
        }

        const latestKm = await tx.mileageReading.findFirst({
          where: { vehicleId: trip.vehicleId },
          orderBy: { km: "desc" },
          select: { km: true },
        });

        if (latestKm && parsed.data.endKm < latestKm.km) {
          throw new Error(`END_KM_LT_LAST:${latestKm.km}`);
        }

        const endTime = new Date();
        const durationMinutes = (endTime.getTime() - trip.startTime.getTime()) / (1000 * 60);
        const distance = parsed.data.endKm - trip.startKm;

        const automaticAnomalies = buildAutomaticAnomalies(distance, durationMinutes);

        const closeResult = await tx.trip.updateMany({
          where: { id: trip.id, status: "OPEN" },
          data: {
            status: "COMPLETED",
            endTime,
            endKm: parsed.data.endKm,
            endQrRaw: endQrRaw || `manual:${trip.vehicleId}`,
            notes: parsed.data.notes || trip.notes,
          },
        });

        if (closeResult.count === 0) {
          throw new Error("ALREADY_CLOSED");
        }

        await tx.mileageReading.create({
          data: {
            vehicleId: trip.vehicleId,
            recordedByUserId: user.id,
            km: parsed.data.endKm,
            date: endTime,
            source: "TRIP",
            notes: `Fine viaggio (${trip.id})`,
          },
        });

        if (automaticAnomalies.length > 0) {
          await tx.tripAnomaly.createMany({
            data: automaticAnomalies.map((a) => ({
              tripId: trip.id,
              type: a.type,
              message: a.message,
              isManual: false,
              createdByUserId: user.id,
            })),
          });
        }

        anomalyCount = automaticAnomalies.length;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "TRIP_NOT_FOUND") return { error: "Viaggio non trovato" };
      if (error.message === "NOT_OWNER") return { error: "Non puoi chiudere questo viaggio" };
      if (error.message === "QR_MISMATCH") return { error: "Il QR di fine viaggio non corrisponde al mezzo" };
      if (error.message === "END_KM_LT_START") return { error: "Km finale inferiore al km iniziale" };
      if (error.message.startsWith("END_KM_LT_LAST:")) {
        const km = error.message.split(":")[1];
        return { error: `Km finale inferiore all'ultimo rilevamento (${km} km)` };
      }
      if (error.message === "ALREADY_CLOSED") return { error: "Il viaggio e gia stato chiuso" };
    }
    return { error: "Impossibile chiudere il viaggio, riprova" };
  }

  revalidatePath("/viaggi");
  revalidatePath("/chilometraggi");
  if (tripVehicleId) {
    revalidatePath(`/mezzi/${tripVehicleId}`);
  }
  revalidatePath("/");

  return {
    success:
      anomalyCount > 0
        ? `Viaggio chiuso con ${anomalyCount} anomal${anomalyCount === 1 ? "ia" : "ie"}`
        : "Viaggio chiuso correttamente",
  };
}

export async function updateTrip(
  _prevState: { error?: string; success?: string } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  const user = await getSessionUser();
  if (!canEditDeleteEntries(user.role)) {
    return { error: "Non autorizzato" };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = tripUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const existingTrip = await prisma.trip.findUnique({
    where: { id: parsed.data.tripId },
    select: { id: true, vehicleId: true },
  });

  if (!existingTrip) {
    return { error: "Viaggio non trovato" };
  }

  const updateData: Prisma.TripUpdateInput = {
    status: parsed.data.status,
    startTime: parsed.data.startTime,
    endTime: parsed.data.endTime,
    startKm: parsed.data.startKm,
    endKm: parsed.data.endKm,
    notes: parsed.data.notes || null,
  };

  if (parsed.data.status === "OPEN") {
    updateData.endQrRaw = null;
  }

  await prisma.trip.update({
    where: { id: existingTrip.id },
    data: updateData,
  });

  revalidatePath("/viaggi");
  revalidatePath("/chilometraggi");
  revalidatePath(`/mezzi/${existingTrip.vehicleId}`);
  revalidatePath("/");

  return { success: "Viaggio aggiornato" };
}

export async function deleteTrip(tripId: string) {
  const user = await getSessionUser();
  if (!canEditDeleteEntries(user.role)) {
    return { error: "Non autorizzato" };
  }

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: {
      id: true,
      vehicleId: true,
      anomalies: {
        select: {
          id: true,
          photos: {
            select: {
              id: true,
              filePath: true,
            },
          },
        },
      },
    },
  });

  if (!trip) {
    return { error: "Viaggio non trovato" };
  }

  const anomalyIds = trip.anomalies.map((anomaly) => anomaly.id);
  const photos = trip.anomalies.flatMap((anomaly) => anomaly.photos);

  for (const photo of photos) {
    try {
      await unlink(photo.filePath);
    } catch {
      // File may already be missing.
    }

    const thumbnailPath = deriveTripAnomalyThumbnailPath(photo.filePath);
    if (thumbnailPath) {
      try {
        await unlink(thumbnailPath);
      } catch {
        // Thumbnail may already be missing.
      }
    }
  }

  await prisma.$transaction(async (tx) => {
    if (anomalyIds.length > 0) {
      await tx.document.deleteMany({
        where: {
          tripAnomalyId: { in: anomalyIds },
        },
      });
    }

    await tx.mileageReading.deleteMany({
      where: {
        vehicleId: trip.vehicleId,
        source: "TRIP",
        notes: {
          contains: trip.id,
        },
      },
    });

    await tx.trip.delete({ where: { id: trip.id } });
  });

  revalidatePath("/viaggi");
  revalidatePath("/segnalazioni");
  revalidatePath("/documenti");
  revalidatePath("/chilometraggi");
  revalidatePath(`/mezzi/${trip.vehicleId}`);
  revalidatePath("/");

  return { success: "Viaggio eliminato" };
}
