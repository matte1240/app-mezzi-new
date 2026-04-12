import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canUploadDocuments } from "@/lib/auth-utils";
import { syncDocumentValidityDeadline } from "@/lib/auto-deadlines";
import { writeFile, mkdir } from "fs/promises";
import { buildDocumentStorage } from "@/lib/file-storage";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const TYPES_REQUIRING_VALID_TO = new Set(["ASSICURAZIONE", "CONTRATTO_NOLEGGIO"]);

function parseDateField(value: FormDataEntryValue | null, options?: { endOfDay?: boolean }): Date | null {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  if (options?.endOfDay) {
    parsed.setHours(23, 59, 59, 999);
  } else {
    parsed.setHours(0, 0, 0, 0);
  }

  return parsed;
}

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
  const validFromRaw = formData.get("validFrom");
  const validToRaw = formData.get("validTo");
  const validFrom = parseDateField(validFromRaw);
  const validTo = parseDateField(validToRaw, { endOfDay: true });

  if (!file || !vehicleId || !type) {
    return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });
  }

  const validTypes = ["CONTRATTO_NOLEGGIO", "ASSICURAZIONE", "LIBRETTO", "CARTA_CIRCOLAZIONE", "ALTRO"];
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: "Tipo documento non valido" }, { status: 400 });
  }

  if (typeof validFromRaw === "string" && validFromRaw.trim() !== "" && !validFrom) {
    return NextResponse.json({ error: "Data inizio validita non valida" }, { status: 400 });
  }

  if (typeof validToRaw === "string" && validToRaw.trim() !== "" && !validTo) {
    return NextResponse.json({ error: "Data fine validita non valida" }, { status: 400 });
  }

  if (TYPES_REQUIRING_VALID_TO.has(type) && !validTo) {
    return NextResponse.json(
      { error: "Per questo tipo documento devi indicare la data di fine validita" },
      { status: 400 }
    );
  }

  if (validFrom && validTo && validTo.getTime() < validFrom.getTime()) {
    return NextResponse.json(
      { error: "La data di fine validita non puo essere precedente alla data di inizio" },
      { status: 400 }
    );
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
  const storage = buildDocumentStorage({
    vehicleId,
    vehiclePlate: vehicle.plate,
    type,
    originalFileName: file.name,
  });
  await mkdir(storage.dirPath, { recursive: true });

  const bytes = await file.arrayBuffer();
  await writeFile(storage.filePath, Buffer.from(bytes));

  const documentType = type as "CONTRATTO_NOLEGGIO" | "ASSICURAZIONE" | "LIBRETTO" | "CARTA_CIRCOLAZIONE" | "ALTRO";

  const document = await prisma.document.create({
    data: {
      vehicleId,
      uploadedByUserId: session.user.id,
      type: documentType,
      name: file.name,
      filePath: storage.filePath,
      mimeType: file.type,
      sizeBytes: file.size,
      notes: notes || null,
      validFrom,
      validTo,
    },
  });

  if (validTo) {
    await syncDocumentValidityDeadline({
      vehicleId,
      documentId: document.id,
      documentType,
      documentName: file.name,
      validTo,
    });
  }

  return NextResponse.json({ id: document.id }, { status: 201 });
}
