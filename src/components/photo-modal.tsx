"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, Download, Trash2, Clock, Camera, X, Loader2 } from "lucide-react";
import { VehiclePhotoTemplate } from "@prisma/client";
import { vehiclePhotoTemplateLabels } from "@/lib/labels";

type Photo = {
  id: string;
  template: string;
  filePath: string;
  uploadedAt: Date;
  uploadedBy: { name: string };
  deletedAt: Date | null;
};

export function PhotoModal({
  isOpen,
  template,
  photo,
  photoHistory,
  canUpload,
  vehicleId,
  onClose,
  onUploadSuccess,
}: {
  isOpen: boolean;
  template: VehiclePhotoTemplate | null;
  photo: Photo | undefined;
  photoHistory: Photo[];
  canUpload: boolean;
  vehicleId: string;
  onClose: () => void;
  onUploadSuccess: () => void;
}) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) handleFile(files[0]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Seleziona un'immagine");
      return;
    }
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("template", template || "");
      const res = await fetch(`/api/vehicles/${vehicleId}/photos`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Upload fallito");
        return;
      }
      onUploadSuccess();
      setShowHistory(false);
    } catch (error) {
      console.error("Upload error", error);
      alert("Errore durante l'upload");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = useCallback(
    async (photoId: string) => {
      if (!confirm("Eliminare questa foto?")) return;
      setIsDeleting(true);
      try {
        const res = await fetch(`/api/vehicles/${vehicleId}/photos?photoId=${photoId}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          alert("Eliminazione fallita");
          return;
        }
        onUploadSuccess();
      } catch (error) {
        console.error("Delete error", error);
        alert("Errore durante l'eliminazione");
      } finally {
        setIsDeleting(false);
      }
    },
    [vehicleId, onUploadSuccess]
  );

  if (!template) return null;

  const label = vehiclePhotoTemplateLabels[template];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0 overflow-hidden gap-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-base font-semibold">{label}</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {photo ? "Foto presente — sostituisci o elimina" : "Nessuna foto caricata"}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[70vh]">
          {/* Current photo */}
          {photo && (
            <div className="px-6 pt-5 space-y-3">
              <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-gray-100 shadow-sm">
                <Image
                  src={`/api/vehicle-photos/${photo.id}/download?variant=thumb`}
                  alt={label}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(photo.uploadedAt).toLocaleString("it-IT", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className="font-medium text-foreground/70">{photo.uploadedBy.name}</span>
              </div>
              <div className="flex gap-2">
                <a
                  href={`/api/vehicle-photos/${photo.id}/download`}
                  download
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
                >
                  <Download className="h-4 w-4 text-blue-600" />
                  Scarica
                </a>
                {canUpload && (
                  <button
                    type="button"
                    onClick={() => handleDelete(photo.id)}
                    disabled={isDeleting}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Elimina
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Upload area */}
          {canUpload && (
            <div className="px-6 pt-4 pb-2">
              {photo && (
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Sostituisci foto
                </p>
              )}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative rounded-xl border-2 border-dashed transition-all ${
                  isDragActive
                    ? "border-blue-400 bg-blue-50"
                    : "border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/50"
                } ${isUploading ? "opacity-60 pointer-events-none" : "cursor-pointer"}`}
              >
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleChange}
                  disabled={isUploading}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="flex flex-col items-center gap-3 py-8 px-4 text-center">
                  {isUploading ? (
                    <>
                      <div className="rounded-full bg-blue-100 p-3">
                        <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                      </div>
                      <p className="text-sm font-medium text-blue-700">Upload in corso…</p>
                    </>
                  ) : isDragActive ? (
                    <>
                      <div className="rounded-full bg-blue-100 p-3">
                        <Upload className="h-6 w-6 text-blue-600" />
                      </div>
                      <p className="text-sm font-medium text-blue-700">Rilascia per caricare</p>
                    </>
                  ) : (
                    <>
                      <div className="rounded-full bg-gray-100 p-3 group-hover:bg-blue-100 transition-colors">
                        <Camera className="h-6 w-6 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Trascina un&apos;immagine qui
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          oppure clicca per selezionarla · JPG, PNG, HEIC
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* History */}
          {photoHistory.length > 0 && (
            <div className="px-6 py-4 border-t mt-2">
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className="flex w-full items-center justify-between text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Storico foto precedenti
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums">
                  {photoHistory.length}
                </span>
              </button>

              {showHistory && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {photoHistory.map((h) => (
                    <div key={h.id} className="group relative">
                      <a
                        href={`/api/vehicle-photos/${h.id}/download`}
                        download
                        className="block"
                      >
                        <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                          <Image
                            src={`/api/vehicle-photos/${h.id}/download?variant=thumb`}
                            alt="Storico"
                            fill
                            unoptimized
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <Download className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1 text-center truncate">
                          {new Date(h.deletedAt || h.uploadedAt).toLocaleDateString("it-IT", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </p>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* No upload permission, no photo */}
          {!canUpload && !photo && (
            <div className="px-6 py-8 flex flex-col items-center gap-2 text-center">
              <Camera className="h-10 w-10 text-gray-200" />
              <p className="text-sm text-muted-foreground">Nessuna foto disponibile</p>
            </div>
          )}

          {/* Bottom padding */}
          <div className="pb-4" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
