"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Camera, TriangleAlert, CheckCircle2 } from "lucide-react";
import { VehiclePhotoTemplate } from "@prisma/client";
import { VehicleMockup } from "./vehicle-mockup";
import { PhotoModal } from "./photo-modal";
import { vehiclePhotoTemplateLabels, vehiclePhotoTemplateOrder } from "@/lib/labels";

type Photo = {
  id: string;
  template: string;
  filePath: string;
  uploadedAt: Date;
  uploadedBy: { name: string };
  deletedAt: Date | null;
};

type Vehicle = {
  id: string;
  brand: string;
  model: string;
  fuelType: string;
  status: string;
};

function getVehicleType(vehicle: Vehicle): "car" | "van" | "truck" | "bus" {
  const brandModel = `${vehicle.brand} ${vehicle.model}`.toLowerCase();
  if (
    (brandModel.includes("fiat") && (brandModel.includes("ducato") || brandModel.includes("iveco"))) ||
    (brandModel.includes("mercedes") && brandModel.includes("sprinter")) ||
    (brandModel.includes("volkswagen") && brandModel.includes("transporter")) ||
    (brandModel.includes("ford") && (brandModel.includes("transit")))
  ) return "van";
  if (brandModel.includes("iveco") || brandModel.includes("man") || brandModel.includes("scania")) return "truck";
  if (brandModel.includes("autobus") || brandModel.includes("bus") || brandModel.includes("setra")) return "bus";
  return "car";
}

export function VehiclePhotosGridMockup({
  vehicleId,
  photos,
  photoHistory,
  canUpload,
  vehicle,
}: {
  vehicleId: string;
  photos: Photo[];
  photoHistory: Photo[];
  canUpload: boolean;
  vehicle: Vehicle;
}) {
  const [selectedTemplate, setSelectedTemplate] = useState<VehiclePhotoTemplate | null>(null);

  const photosMap = Object.fromEntries(photos.map((p) => [p.template, p]));

  const hasPhoto = useCallback(
    (template: VehiclePhotoTemplate) => !!photosMap[template],
    [photosMap]
  );

  const vehicleType = getVehicleType(vehicle);
  const uploadedCount = vehiclePhotoTemplateOrder.filter((t) => !!photosMap[t]).length;
  const totalCount = vehiclePhotoTemplateOrder.length;

  const selectedPhoto = selectedTemplate ? photosMap[selectedTemplate] : undefined;
  const selectedHistory = selectedTemplate
    ? photoHistory.filter((p) => p.template === selectedTemplate)
    : [];

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">Foto caricate</span>
          <span className="font-semibold tabular-nums">
            <span className={uploadedCount === totalCount ? "text-green-600" : "text-blue-600"}>
              {uploadedCount}
            </span>
            <span className="text-muted-foreground">/{totalCount}</span>
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              uploadedCount === totalCount ? "bg-green-500" : "bg-blue-500"
            }`}
            style={{ width: `${(uploadedCount / totalCount) * 100}%` }}
          />
        </div>
        {uploadedCount === totalCount && (
          <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Tutte le foto sono state caricate
          </div>
        )}
      </div>

      {/* Layout: diagram + grid */}
      <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
        {/* Vehicle diagram */}
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-xl border bg-card p-4 w-full">
            <p className="text-xs font-medium text-muted-foreground text-center mb-3 uppercase tracking-wide">
              Clicca sul veicolo
            </p>
            <VehicleMockup
              vehicleType={vehicleType}
              hasPhoto={hasPhoto}
              onHotspotClick={setSelectedTemplate}
            />
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded-full bg-blue-500" /> Mancante
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded-full bg-green-500" /> Caricata
            </span>
          </div>
        </div>

        {/* Photo cards grid */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 content-start">
          {vehiclePhotoTemplateOrder.map((template) => {
            const photo = photosMap[template];
            const label = vehiclePhotoTemplateLabels[template] || template;

            return (
              <button
                key={template}
                type="button"
                onClick={() => setSelectedTemplate(template as VehiclePhotoTemplate)}
                className="group relative flex flex-col rounded-xl border bg-card text-left shadow-sm transition-all hover:shadow-md hover:border-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 overflow-hidden"
              >
                {/* Photo preview or placeholder */}
                <div className="relative aspect-video w-full overflow-hidden bg-muted">
                  {photo ? (
                    <Image
                      src={`/api/vehicle-photos/${photo.id}/download?variant=thumb`}
                      alt={label}
                      fill
                      unoptimized
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gray-50 group-hover:bg-blue-50 transition-colors">
                      <Camera className="h-8 w-8 text-gray-300 group-hover:text-blue-300 transition-colors" />
                      {canUpload && (
                        <span className="text-xs text-gray-400 group-hover:text-blue-400 transition-colors">
                          Clicca per caricare
                        </span>
                      )}
                    </div>
                  )}

                  {/* Status badge */}
                  <div className={`absolute top-2 right-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold shadow-sm ${
                    photo ? "bg-green-500 text-white" : "bg-white/90 text-gray-500 border"
                  }`}>
                    {photo ? (
                      <>
                        <CheckCircle2 className="h-3 w-3" />
                        OK
                      </>
                    ) : (
                      <>
                        <Camera className="h-3 w-3" />
                        Mancante
                      </>
                    )}
                  </div>
                </div>

                {/* Card footer */}
                <div className="px-3 py-2.5 space-y-0.5">
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  {photo ? (
                    <p className="text-xs text-muted-foreground">
                      {new Date(photo.uploadedAt).toLocaleDateString("it-IT", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                      {" · "}
                      {photo.uploadedBy.name}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Nessuna foto</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Link to anomalies */}
      <div className="flex justify-start pt-2">
        <Link
          href={`/segnalazioni?vehicleId=${vehicleId}`}
          className="inline-flex items-center gap-2 rounded-lg border bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700 hover:bg-orange-100 transition-colors"
        >
          <TriangleAlert className="h-4 w-4" />
          Vedi anomalie segnalate
        </Link>
      </div>

      {/* Photo modal */}
      <PhotoModal
        isOpen={selectedTemplate !== null}
        template={selectedTemplate}
        photo={selectedPhoto}
        photoHistory={selectedHistory}
        canUpload={canUpload}
        vehicleId={vehicleId}
        onClose={() => setSelectedTemplate(null)}
        onUploadSuccess={() => {
          setSelectedTemplate(null);
          window.location.reload();
        }}
      />
    </div>
  );
}
