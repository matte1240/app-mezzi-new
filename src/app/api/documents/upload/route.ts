import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canUploadDocuments } from "@/lib/auth-utils";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  if (!canUploadDocuments(session.user.role)) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const vehicleId = formData.get("vehicleId") as string;
  const type = formData.get("type") as string;
  const notes = formData.get("notes") as string | null;

  if (!file || !vehicleId || !type) {
    return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });
  }

  const validTypes = ["CONTRATTO_NOLEGGIO", "ASSICURAZIONE", "LIBRETTO", "CARTA_CIRCOLAZIONE", "ALTRO"];
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: "Tipo documento non valido" }, { status: 400 });
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json(
      { error: "Solo file PDF consentiti" },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File troppo grande (max 10MB)" },
      { status: 400 }
    );
  }

  // Validate vehicleId exists
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
  });
  if (!vehicle) {
    return NextResponse.json(
      { error: "Veicolo non trovato" },
      { status: 404 }
    );
  }

  // Save file
  const dirPath = join(UPLOAD_DIR, vehicleId);
  await mkdir(dirPath, { recursive: true });

  const fileExt = ".pdf";
  const fileName = `${uuidv4()}${fileExt}`;
  const filePath = join(dirPath, fileName);

  const bytes = await file.arrayBuffer();
  await writeFile(filePath, Buffer.from(bytes));

  const document = await prisma.document.create({
    data: {
      vehicleId,
      uploadedByUserId: session.user.id,
      type: type as "CONTRATTO_NOLEGGIO" | "ASSICURAZIONE" | "LIBRETTO" | "CARTA_CIRCOLAZIONE" | "ALTRO",
      name: file.name,
      filePath: filePath,
      mimeType: file.type,
      sizeBytes: file.size,
      notes: notes || null,
    },
  });

  return NextResponse.json({ id: document.id }, { status: 201 });
}
