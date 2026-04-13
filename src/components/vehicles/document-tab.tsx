"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, Trash2, FileText, Camera, Pencil } from "lucide-react";
import { useState } from "react";
import {
  documentTypeLabels,
  tripAnomalyStatusColors,
  tripAnomalyStatusLabels,
  tripAnomalyTypeLabels,
} from "@/lib/labels";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type DocumentRecord = {
  id: string;
  type: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  notes: string | null;
  createdAt: string;
  validFrom: string | null;
  validTo: string | null;
  uploadedByName: string;
  tripAnomalyId: string | null;
  tripAnomalyType: string | null;
  tripAnomalyStatus: string | null;
  tripId: string | null;
};

function requiresValidityPeriod(documentType: string) {
  return documentType === "ASSICURAZIONE" || documentType === "CONTRATTO_NOLEGGIO";
}

function formatValidityPeriod(validFrom: string | null, validTo: string | null) {
  if (!validFrom && !validTo) return "—";
  if (validFrom && validTo) {
    return `${new Date(validFrom).toLocaleDateString("it-IT")} - ${new Date(validTo).toLocaleDateString("it-IT")}`;
  }
  if (validTo) {
    return `Fino al ${new Date(validTo).toLocaleDateString("it-IT")}`;
  }
  return `Dal ${new Date(validFrom!).toLocaleDateString("it-IT")}`;
}

function toDateInputValue(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

export function DocumentTab({
  vehicleId,
  documents,
  canUpload,
  canEditDelete,
}: {
  vehicleId: string;
  documents: DocumentRecord[];
  canUpload: boolean;
  canEditDelete: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState("CONTRATTO_NOLEGGIO");
  const [editingDoc, setEditingDoc] = useState<DocumentRecord | null>(null);
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState("");

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploading(true);
    const formData = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Errore upload");
      } else {
        toast.success("Documento caricato");
        window.location.reload();
      }
    } catch {
      toast.error("Errore di rete");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(docId: string) {
    if (!confirm("Eliminare questo documento?")) return;
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Documento eliminato");
        window.location.reload();
      } else {
        toast.error("Errore eliminazione");
      }
    } catch {
      toast.error("Errore di rete");
    }
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  const standardDocuments = documents.filter((doc) => !doc.tripAnomalyId);
  const anomalyPhotos = documents.filter((doc) => !!doc.tripAnomalyId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Documenti</h3>
        {canUpload && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowForm(!showForm)}
          >
            <Upload className="mr-2 h-4 w-4" />
            Carica Documento
          </Button>
        )}
      </div>

      {showForm && canUpload && (
        <form onSubmit={handleUpload} className="rounded-lg border p-4 space-y-4">
          <input type="hidden" name="vehicleId" value={vehicleId} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo *</label>
              <select
                name="type"
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                required
              >
                <option value="CONTRATTO_NOLEGGIO">Contratto noleggio/leasing</option>
                <option value="ASSICURAZIONE">Assicurazione</option>
                <option value="LIBRETTO">Libretto</option>
                <option value="CARTA_CIRCOLAZIONE">Carta di circolazione</option>
                <option value="ALTRO">Altro</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Note</label>
              <Input name="notes" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Validita da</label>
              <Input name="validFrom" type="date" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Validita fino a {requiresValidityPeriod(uploadType) ? "*" : ""}</label>
              <Input
                name="validTo"
                type="date"
                required={requiresValidityPeriod(uploadType)}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Per assicurazione e contratto noleggio/leasing e obbligatoria la data di fine validita.
          </p>
          <div className="space-y-2">
            <label className="text-sm font-medium">File PDF *</label>
            <Input type="file" name="file" accept=".pdf" required />
          </div>
          <Button type="submit" size="sm" disabled={uploading}>
            {uploading ? "Caricamento..." : "Carica"}
          </Button>
        </form>
      )}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Dimensione</TableHead>
              <TableHead>Caricato da</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Validita</TableHead>
              <TableHead>Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {standardDocuments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nessun documento standard
                </TableCell>
              </TableRow>
            ) : (
              standardDocuments.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>
                    <Badge variant="outline">
                      {documentTypeLabels[d.type]}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    {d.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatSize(d.sizeBytes)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {d.uploadedByName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(d.createdAt).toLocaleDateString("it-IT")}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatValidityPeriod(d.validFrom, d.validTo)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <a href={`/api/documents/${d.id}/download`} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Scarica">
                          <Download className="h-4 w-4" />
                        </Button>
                      </a>
                                      {canEditDelete && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Modifica"
                          onClick={() => {
                            setEditError("");
                            setEditingDoc(d);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                                      {canEditDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          title="Elimina"
                          onClick={() => handleDelete(d.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {anomalyPhotos.length > 0 && (
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Camera className="h-4 w-4" />
            Foto Anomalie
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Segnalazione</TableHead>
                  <TableHead>Nome file</TableHead>
                  <TableHead>Dimensione</TableHead>
                  <TableHead>Caricato da</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {anomalyPhotos.map((photo) => (
                  <TableRow key={photo.id}>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1">
                        <Badge variant="outline">
                          {photo.tripAnomalyType
                            ? tripAnomalyTypeLabels[photo.tripAnomalyType] || photo.tripAnomalyType
                            : "Segnalazione"}
                        </Badge>
                        {photo.tripAnomalyStatus ? (
                          <Badge className={tripAnomalyStatusColors[photo.tripAnomalyStatus] || ""}>
                            {tripAnomalyStatusLabels[photo.tripAnomalyStatus] || photo.tripAnomalyStatus}
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="flex items-center gap-2">
                      <Camera className="h-4 w-4 text-muted-foreground" />
                      {photo.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatSize(photo.sizeBytes)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {photo.uploadedByName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(photo.createdAt).toLocaleDateString("it-IT")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <a href={`/api/documents/${photo.id}/download`} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Apri file">
                            <Download className="h-4 w-4" />
                          </Button>
                        </a>
                        {photo.tripAnomalyId ? (
                          <Link href={`/segnalazioni/${photo.tripAnomalyId}`}>
                            <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs" title="Vai alla segnalazione">
                              Dettaglio
                            </Button>
                          </Link>
                        ) : null}
                        {canEditDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            title="Elimina"
                            onClick={() => handleDelete(photo.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <Dialog
        open={!!editingDoc}
        onOpenChange={(open) => {
          if (!open) {
            setEditingDoc(null);
            setEditing(false);
            setEditError("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica documento</DialogTitle>
            <DialogDescription>
              Aggiorna validita e note. La scadenza automatica viene riallineata in base alla data di fine validita.
            </DialogDescription>
          </DialogHeader>

          {editingDoc ? (
            <form
              key={editingDoc.id}
              onSubmit={async (e) => {
                e.preventDefault();
                setEditing(true);
                setEditError("");
                const formData = new FormData(e.currentTarget);

                try {
                  const res = await fetch(`/api/documents/${editingDoc.id}`, {
                    method: "PATCH",
                    body: formData,
                  });
                  const data = await res.json();
                  if (!res.ok) {
                    setEditError(data.error || "Errore aggiornamento documento");
                  } else {
                    toast.success("Documento aggiornato");
                    setEditingDoc(null);
                    window.location.reload();
                  }
                } catch {
                  setEditError("Errore di rete");
                } finally {
                  setEditing(false);
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Documento</label>
                <p className="text-sm text-muted-foreground break-all">{editingDoc.name}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Validita da</label>
                  <Input
                    name="validFrom"
                    type="date"
                    defaultValue={toDateInputValue(editingDoc.validFrom)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    Validita fino a {requiresValidityPeriod(editingDoc.type) ? "*" : ""}
                  </label>
                  <Input
                    name="validTo"
                    type="date"
                    defaultValue={toDateInputValue(editingDoc.validTo)}
                    required={requiresValidityPeriod(editingDoc.type)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Note</label>
                <Input name="notes" defaultValue={editingDoc.notes || ""} />
              </div>

              {editError && <p className="text-sm text-destructive">{editError}</p>}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingDoc(null)}>
                  Annulla
                </Button>
                <Button type="submit" disabled={editing}>
                  {editing ? "Salvataggio..." : "Salva"}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
