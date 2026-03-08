"use client";

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
import { Upload, Download, Trash2, FileText } from "lucide-react";
import { useState } from "react";
import { documentTypeLabels } from "@/lib/labels";
import { toast } from "sonner";

type DocumentRecord = {
  id: string;
  type: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  notes: string | null;
  createdAt: string;
  uploadedByName: string;
};

export function DocumentTab({
  vehicleId,
  documents,
  canUpload,
}: {
  vehicleId: string;
  documents: DocumentRecord[];
  canUpload: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);

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
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                required
              >
                <option value="CONTRATTO_NOLEGGIO">Contratto noleggio</option>
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
          </div>
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
              <TableHead>Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nessun documento
                </TableCell>
              </TableRow>
            ) : (
              documents.map((d) => (
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
                  <TableCell>
                    <div className="flex gap-1">
                      <a href={`/api/documents/${d.id}/download`} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Scarica">
                          <Download className="h-4 w-4" />
                        </Button>
                      </a>
                      {canUpload && (
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
    </div>
  );
}
