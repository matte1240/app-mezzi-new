"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Download, Trash2, Clock } from "lucide-react";
import { vehiclePhotoTemplateLabels, vehiclePhotoTemplateOrder } from "@/lib/labels";

type Photo = {
  id: string;
  template: string;
  filePath: string;
  uploadedAt: Date;
  uploadedBy: { name: string };
  deletedAt: Date | null;
};

export function VehiclePhotosGrid({
  vehicleId,
  photos,
  photoHistory,
  canUpload,
}: {
  vehicleId: string;
  photos: Photo[];
  photoHistory: Photo[];
  canUpload: boolean;
}) {
  const [uploading, setUploading] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);

  const photosMap = Object.fromEntries(
    photos.map((p) => [p.template, p])
  );

  const handleUpload = useCallback(async (template: string, file: File) => {
    if (!file) return;

    setUploading(template);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("template", template);

      const res = await fetch(`/api/vehicles/${vehicleId}/photos`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Upload fallito");
        return;
      }

      // Reload page to refresh photos
      window.location.reload();
    } catch (error) {
      console.error("Upload error", error);
      alert("Errore durante l'upload");
    } finally {
      setUploading(template);
      setIsLoading(false);
    }
  }, [vehicleId]);

  const handleDelete = useCallback(async (photoId: string) => {
    if (!confirm("Eliminare questa foto?")) return;

    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/photos?photoId=${photoId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        alert("Eliminazione fallita");
        return;
      }

      window.location.reload();
    } catch (error) {
      console.error("Delete error", error);
      alert("Errore durante l'eliminazione");
    }
  }, [vehicleId]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {vehiclePhotoTemplateOrder.map((template) => {
          const photo = photosMap[template];
          const history = photoHistory.filter((p) => p.template === template);
          const isOpen = showHistory[template];

          return (
            <Card key={template}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  {vehiclePhotoTemplateLabels[template] || template}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Upload area */}
                {canUpload && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Carica foto
                    </label>
                    <UploadArea
                      template={template}
                      onFile={(file) => handleUpload(template, file)}
                      isUploading={uploading === template}
                      isLoading={isLoading}
                    />
                  </div>
                )}

                {/* Current photo */}
                {photo ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Foto attuale</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(photo.uploadedAt).toLocaleString("it-IT")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          di {photo.uploadedBy.name}
                        </span>
                      </div>
                    </div>
                    <div className="relative bg-gray-100 rounded-md overflow-hidden aspect-video">
                      <Image
                        src={`/api/vehicle-photos/${photo.id}/download?variant=thumb`}
                        alt={vehiclePhotoTemplateLabels[template]}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={`/api/vehicle-photos/${photo.id}/download`}
                        download
                        className="inline-flex items-center gap-2 rounded-md bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                      >
                        <Download className="h-3 w-3" />
                        Scarica originale
                      </a>
                      {canUpload && (
                        <button
                          onClick={() => handleDelete(photo.id)}
                          className="inline-flex items-center gap-2 rounded-md bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                        >
                          <Trash2 className="h-3 w-3" />
                          Elimina
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground italic">
                    Nessuna foto caricata
                  </div>
                )}

                {/* History */}
                {history.length > 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    <button
                      onClick={() => setShowHistory({ ...showHistory, [template]: !isOpen })}
                      className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      <Clock className="h-3.5 w-3.5" />
                      {isOpen ? "Nascondi" : "Mostra"} storico ({history.length})
                    </button>
                    {isOpen && (
                      <div className="space-y-2 ml-2 mt-2">
                        {history.map((h) => (
                          <div
                            key={h.id}
                            className="flex items-center justify-between text-xs p-2 rounded-md bg-gray-50 border"
                          >
                            <div>
                              <div className="text-gray-600">
                                {new Date(h.deletedAt || h.uploadedAt).toLocaleString("it-IT")}
                              </div>
                              <div className="text-muted-foreground">da {h.uploadedBy.name}</div>
                            </div>
                            <a
                              href={`/api/vehicle-photos/${h.id}/download`}
                              download
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Download className="h-3 w-3" />
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function UploadArea({
  onFile,
  isLoading,
}: {
  template: string;
  onFile: (file: File) => void;
  isUploading: boolean;
  isLoading: boolean;
}) {
  const [isDragActive, setIsDragActive] = useState(false);

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
    if (files && files[0]) {
      onFile(files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFile(e.target.files[0]);
    }
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-md p-6 text-center transition-colors ${
        isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50 hover:border-gray-400"
      } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleChange}
        disabled={isLoading}
        className="absolute inset-0 opacity-0 cursor-pointer"
      />
      <div className="flex flex-col items-center gap-2">
        <Upload className="h-6 w-6 text-gray-400" />
        <div className="text-sm">
          {isLoading ? (
            <span className="text-muted-foreground">Upload in corso...</span>
          ) : (
            <>
              <span className="font-medium text-gray-700">Trascina una foto qui</span>
              <br />
              <span className="text-xs text-muted-foreground">o clicca per selezionarla</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
