import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readFile } from "fs/promises";
import { deriveTripAnomalyThumbnailPath } from "@/lib/file-storage";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const { id } = await params;

  const document = await prisma.document.findUnique({
    where: { id },
    include: { vehicle: true },
  });

  if (!document) {
    return NextResponse.json({ error: "Documento non trovato" }, { status: 404 });
  }

  // Driver can only download docs from assigned vehicles
  if (
    session.user.role === "DRIVER" &&
    document.vehicle.assignedDriverId !== session.user.id
  ) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const variant = request.nextUrl.searchParams.get("variant");

  if (variant === "thumb") {
    const thumbnailPath = deriveTripAnomalyThumbnailPath(document.filePath);
    if (thumbnailPath) {
      try {
        const thumbnailBuffer = await readFile(thumbnailPath);
        return new NextResponse(thumbnailBuffer, {
          headers: {
            "Content-Type": "image/webp",
            "Content-Disposition": `inline; filename="thumb-${document.name}"`,
            "Content-Length": String(thumbnailBuffer.length),
          },
        });
      } catch {
        // Fallback to original file when thumbnail is missing.
      }
    }
  }

  try {
    const fileBuffer = await readFile(document.filePath);
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": document.mimeType,
        "Content-Disposition": `inline; filename="${document.name}"`,
        "Content-Length": String(document.sizeBytes),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "File non trovato su disco" },
      { status: 404 }
    );
  }
}
