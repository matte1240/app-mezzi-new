import { prisma } from "@/lib/prisma";
import { getSessionUser, canUploadVehiclePhotos, canManageVehicles } from "@/lib/auth-utils";
import {
  buildVehiclePhotoStorage,
  createVehiclePhotoThumbnail,
  deriveVehiclePhotoThumbnailPath,
} from "@/lib/file-storage";
import { VehiclePhotoTemplate } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { mkdir, writeFile, unlink } from "fs/promises";
import { z } from "zod";

const MAX_PHOTO_SIZE = 12 * 1024 * 1024; // 12MB
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

const vehiclePhotoTemplateSchema = z.nativeEnum(VehiclePhotoTemplate);

// GET /api/vehicles/[vehicleId]/photos - retrieve all photos for vehicle
export async function GET(
  request: Request,
  { params }: { params: Promise<{ vehicleId: string }> }
) {
  const user = await getSessionUser();
  const { vehicleId } = await params;

  // Check vehicle exists and user can view it
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: { id: true, assignedDriverId: true },
  });

  if (!vehicle) {
    return Response.json({ error: "Veicolo non trovato" }, { status: 404 });
  }

  // Role-based access: DRIVER only own vehicle, ADMIN/FLEET_MANAGER all
  if (user.role === "DRIVER" && vehicle.assignedDriverId !== user.id) {
    return Response.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const photos = await prisma.vehiclePhoto.findMany({
    where: { vehicleId },
    include: {
      uploadedBy: { select: { name: true } },
    },
    orderBy: [{ template: "asc" }, { uploadedAt: "desc" }],
  });

  return Response.json({ photos });
}

// POST /api/vehicles/[vehicleId]/photos - upload a new photo
export async function POST(
  request: Request,
  { params }: { params: Promise<{ vehicleId: string }> }
) {
  const user = await getSessionUser();
  if (!canUploadVehiclePhotos(user.role)) {
    return Response.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const { vehicleId } = await params;

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: { id: true, plate: true, assignedDriverId: true },
  });

  if (!vehicle) {
    return Response.json({ error: "Veicolo non trovato" }, { status: 404 });
  }

  // DRIVER can only upload to assigned vehicle
  if (user.role === "DRIVER" && vehicle.assignedDriverId !== user.id) {
    return Response.json({ error: "Non autorizzato" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const template = formData.get("template") as string;

    if (!file || !template) {
      return Response.json({ error: "File e template obbligatori" }, { status: 400 });
    }

    if (!ALLOWED_MIME.has(file.type)) {
      return Response.json({ error: "Formato non supportato. Usa JPG, PNG, WebP, HEIC o HEIF" }, { status: 400 });
    }

    if (file.size > MAX_PHOTO_SIZE) {
      return Response.json({ error: "File massimo 12MB" }, { status: 400 });
    }

    // Soft delete old photo with same template
    const oldPhoto = await prisma.vehiclePhoto.findFirst({
      where: { vehicleId, template: vehiclePhotoTemplateSchema.parse(template) as VehiclePhotoTemplate, deletedAt: null },
      select: { id: true, filePath: true },
    });

    const storage = buildVehiclePhotoStorage({
      vehicleId,
      vehiclePlate: vehicle.plate,
      template,
      mimeType: file.type,
    });

    await mkdir(storage.originalDir, { recursive: true });
    await mkdir(storage.thumbnailDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    await writeFile(storage.filePath, Buffer.from(bytes));

    // Generate thumbnail
    try {
      await createVehiclePhotoThumbnail(storage.filePath, storage.thumbnailPath);
    } catch {
      console.warn("Vehicle photo thumbnail generation failed", {
        vehicleId,
        template,
        photoPath: storage.filePath,
        thumbnailPath: storage.thumbnailPath,
      });
    }

    // Create new photo record, soft delete old if exists
    const newPhoto = await prisma.vehiclePhoto.create({
      data: {
        vehicleId,
        template: vehiclePhotoTemplateSchema.parse(template) as VehiclePhotoTemplate,
        filePath: storage.filePath,
        uploadedByUserId: user.id,
      },
    });

    if (oldPhoto) {
      // Keep previous files for photo history preview/download and only soft-delete the DB record.
      await prisma.vehiclePhoto.update({
        where: { id: oldPhoto.id },
        data: { deletedAt: new Date() },
      });
    }

    revalidatePath(`/stato-mezzo/${vehicleId}`);
    revalidatePath(`/mezzi/${vehicleId}`);
    revalidatePath("/");

    return Response.json({ photo: newPhoto }, { status: 201 });
  } catch (error) {
    console.error("Vehicle photo upload failed", { vehicleId, error });
    return Response.json({ error: "Upload fallito, riprova" }, { status: 500 });
  }
}

// DELETE /api/vehicles/[vehicleId]/photos/[photoId] - delete a photo
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ vehicleId: string }> }
) {
  const user = await getSessionUser();
  if (!canManageVehicles(user.role)) {
    return Response.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const { vehicleId } = await params;
  const url = new URL(request.url);
  const photoId = url.searchParams.get("photoId");

  if (!photoId) {
    return Response.json({ error: "ID foto obbligatorio" }, { status: 400 });
  }

  const photo = await prisma.vehiclePhoto.findUnique({
    where: { id: photoId },
    select: { id: true, vehicleId: true, filePath: true, deletedAt: true, template: true },
  });

  if (!photo || photo.vehicleId !== vehicleId) {
    return Response.json({ error: "Foto non trovata" }, { status: 404 });
  }

  // Delete current photo files.
  try {
    await unlink(photo.filePath).catch(() => {});
    const thumbPath = deriveVehiclePhotoThumbnailPath(photo.filePath);
    if (thumbPath) {
      await unlink(thumbPath).catch(() => {});
    }
  } catch {
    console.warn("Could not delete photo file", { photoId });
  }

  // Explicit delete must be permanent: remove DB row.
  await prisma.vehiclePhoto.delete({
    where: { id: photoId },
  });

  // Also purge stale historical rows for the same template to avoid showing deleted photos again.
  const historical = await prisma.vehiclePhoto.findMany({
    where: {
      vehicleId,
      template: photo.template,
      deletedAt: { not: null },
    },
    select: { id: true, filePath: true },
  });

  for (const oldPhoto of historical) {
    await unlink(oldPhoto.filePath).catch(() => {});
    const oldThumbPath = deriveVehiclePhotoThumbnailPath(oldPhoto.filePath);
    if (oldThumbPath) {
      await unlink(oldThumbPath).catch(() => {});
    }
  }

  if (historical.length > 0) {
    await prisma.vehiclePhoto.deleteMany({
      where: { id: { in: historical.map((p) => p.id) } },
    });
  }

  revalidatePath(`/stato-mezzo/${vehicleId}`);
  revalidatePath(`/mezzi/${vehicleId}`);
  revalidatePath("/");

  return Response.json({ success: true });
}
