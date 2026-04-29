import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, canManageVehicles } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { readFile } from "fs/promises";
import { deriveVehiclePhotoThumbnailPath } from "@/lib/file-storage";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const { photoId } = await params;

  const photo = await prisma.vehiclePhoto.findUnique({
    where: { id: photoId },
    include: { vehicle: true },
  });

  if (!photo) {
    return NextResponse.json({ error: "Foto non trovata" }, { status: 404 });
  }

  // DRIVER can only download photos from assigned vehicles
  if (user.role === "DRIVER" && photo.vehicle.assignedDriverId !== user.id) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const variant = request.nextUrl.searchParams.get("variant");

  if (variant === "thumb") {
    const thumbnailPath = deriveVehiclePhotoThumbnailPath(photo.filePath);
    if (thumbnailPath) {
      try {
        const thumbnailBuffer = await readFile(thumbnailPath);
        return new NextResponse(thumbnailBuffer, {
          headers: {
            "Content-Type": "image/webp",
            "Content-Disposition": `inline`,
            "Content-Length": String(thumbnailBuffer.length),
          },
        });
      } catch {
        // Fallback to original file when thumbnail is missing.
      }
    }
  }

  try {
    const fileBuffer = await readFile(photo.filePath);
    const mimeType = photo.filePath.endsWith(".heic") || photo.filePath.endsWith(".heif")
      ? "image/heic"
      : "image/jpeg";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `inline`,
        "Content-Length": String(fileBuffer.length),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "File non trovato su disco" },
      { status: 404 }
    );
  }
}
