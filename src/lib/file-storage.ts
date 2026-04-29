import { randomUUID } from "crypto";
import { mkdir } from "fs/promises";
import { dirname, extname, join, parse } from "path";
import sharp from "sharp";

const DOCUMENT_TYPE_DIRS: Record<string, string> = {
  CONTRATTO_NOLEGGIO: "contratto-noleggio",
  ASSICURAZIONE: "assicurazione",
  LIBRETTO: "libretto",
  CARTA_CIRCOLAZIONE: "carta-circolazione",
  ALTRO: "altro",
};

const IMAGE_EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/heic": ".heic",
  "image/heif": ".heif",
};

export function resolveUploadDir() {
  const configured = process.env.UPLOAD_DIR || "./uploads";
  if (process.env.NODE_ENV === "development" && configured.startsWith("/app/")) {
    return "./uploads";
  }
  return configured;
}

function normalizeToken(value: string, fallback: string) {
  const normalized = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return normalized || fallback;
}

function nowStamp(date = new Date()) {
  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}-${hh}${mi}${ss}`;
}

function shortToken(value: string, fallback: string) {
  return normalizeToken(value, fallback).slice(0, 10);
}

function resolveImageExtension(originalName: string, mimeType: string) {
  const fromName = extname(originalName || "").toLowerCase();
  if (fromName) return fromName;
  return IMAGE_EXT_BY_MIME[mimeType] || ".jpg";
}

export function buildDocumentStorage({
  vehicleId,
  vehiclePlate,
  type,
  originalFileName,
}: {
  vehicleId: string;
  vehiclePlate: string;
  type: string;
  originalFileName: string;
}) {
  const uploadDir = resolveUploadDir();
  const typeDir = DOCUMENT_TYPE_DIRS[type] || "altro";
  const dirPath = join(uploadDir, vehicleId, "documenti", typeDir);

  const stamp = nowStamp();
  const plate = normalizeToken(vehiclePlate, "mezzo");
  const originalBase = normalizeToken(parse(originalFileName || "").name, "documento").slice(0, 40);
  const unique = randomUUID().slice(0, 8);

  const fileName = `${stamp}__${plate}__${typeDir}__${originalBase}__${unique}.pdf`;
  const filePath = join(dirPath, fileName);

  return { dirPath, fileName, filePath };
}

export function buildTripAnomalyPhotoStorage({
  vehicleId,
  vehiclePlate,
  tripId,
  anomalyId,
  originalFileName,
  mimeType,
  index,
}: {
  vehicleId: string;
  vehiclePlate: string;
  tripId: string;
  anomalyId: string;
  originalFileName: string;
  mimeType: string;
  index: number;
}) {
  const uploadDir = resolveUploadDir();
  const originalDir = join(uploadDir, vehicleId, "foto-anomalie", "original");
  const thumbnailDir = join(uploadDir, vehicleId, "foto-anomalie", "thumbnail");

  const stamp = nowStamp();
  const plate = normalizeToken(vehiclePlate, "mezzo");
  const trip = shortToken(tripId, "trip");
  const anomaly = shortToken(anomalyId, "anomalia");
  const imageIndex = String(index + 1).padStart(2, "0");
  const unique = randomUUID().slice(0, 8);
  const extension = resolveImageExtension(originalFileName, mimeType);

  const baseName = `${stamp}__${plate}__trip-${trip}__anom-${anomaly}__img-${imageIndex}__${unique}`;
  const fileName = `${baseName}${extension}`;
  const filePath = join(originalDir, fileName);
  const thumbnailPath = join(thumbnailDir, `${baseName}.webp`);

  return {
    originalDir,
    thumbnailDir,
    fileName,
    filePath,
    thumbnailPath,
  };
}

export function deriveTripAnomalyThumbnailPath(filePath: string) {
  const marker = `${join("foto-anomalie", "original")}`;
  if (!filePath.includes(marker)) return null;

  const dir = dirname(filePath).replace(join("foto-anomalie", "original"), join("foto-anomalie", "thumbnail"));
  const base = parse(filePath).name;
  return join(dir, `${base}.webp`);
}

export async function createTripAnomalyThumbnail(originalPath: string, thumbnailPath: string) {
  await mkdir(dirname(thumbnailPath), { recursive: true });
  await sharp(originalPath)
    .rotate()
    .resize({ width: 640, height: 640, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 72 })
    .toFile(thumbnailPath);
}

export function buildVehiclePhotoStorage({
  vehicleId,
  vehiclePlate,
  template,
  mimeType,
}: {
  vehicleId: string;
  vehiclePlate: string;
  template: string;
  mimeType: string;
}) {
  const uploadDir = resolveUploadDir();
  const originalDir = join(uploadDir, vehicleId, "foto-stato", "original");
  const thumbnailDir = join(uploadDir, vehicleId, "foto-stato", "thumbnail");

  const stamp = nowStamp();
  const plate = normalizeToken(vehiclePlate, "mezzo");
  const templateNorm = normalizeToken(template, "template");
  const unique = randomUUID().slice(0, 8);
  const extension = resolveImageExtension("", mimeType);

  const baseName = `${stamp}__${plate}__${templateNorm}__${unique}`;
  const fileName = `${baseName}${extension}`;
  const filePath = join(originalDir, fileName);
  const thumbnailPath = join(thumbnailDir, `${baseName}.webp`);

  return {
    originalDir,
    thumbnailDir,
    fileName,
    filePath,
    thumbnailPath,
  };
}

export function deriveVehiclePhotoThumbnailPath(filePath: string) {
  const marker = `${join("foto-stato", "original")}`;
  if (!filePath.includes(marker)) return null;

  const dir = dirname(filePath).replace(join("foto-stato", "original"), join("foto-stato", "thumbnail"));
  const base = parse(filePath).name;
  return join(dir, `${base}.webp`);
}

export async function createVehiclePhotoThumbnail(originalPath: string, thumbnailPath: string) {
  await mkdir(dirname(thumbnailPath), { recursive: true });
  await sharp(originalPath)
    .rotate()
    .resize({ width: 800, height: 600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(thumbnailPath);
}
