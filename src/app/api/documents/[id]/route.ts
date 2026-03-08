import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canUploadDocuments } from "@/lib/auth-utils";
import { unlink } from "fs/promises";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  if (!canUploadDocuments(session.user.role)) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const { id } = await params;

  const document = await prisma.document.findUnique({ where: { id } });
  if (!document) {
    return NextResponse.json({ error: "Documento non trovato" }, { status: 404 });
  }

  // Delete file from disk
  try {
    await unlink(document.filePath);
  } catch {
    // File may already be gone
  }

  await prisma.document.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
