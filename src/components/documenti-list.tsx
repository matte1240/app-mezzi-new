"use client";

import { useState, useMemo } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { documentTypeLabels } from "@/lib/labels";
import { Download, FileText, Search, Truck, ChevronDown, ChevronRight, ChevronUp, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export type DocItem = {
  id: string;
  name: string;
  type: string;
  sizeBytes: number;
  createdAt: string;
  vehicleId: string;
  vehiclePlate: string;
  vehicleBrand: string;
  vehicleModel: string;
  uploadedByName: string;
};

export type VehicleOption = {
  id: string;
  plate: string;
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const allDocTypes = Object.entries(documentTypeLabels);

export function DocumentiList({ documents, vehicles = [], canUpload = false }: { documents: DocItem[]; vehicles?: VehicleOption[]; canUpload?: boolean }) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [openVehicles, setOpenVehicles] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ error?: string; success?: string }>({});
  const router = useRouter();

  const toggle = (vehicleId: string) => {
    setOpenVehicles((prev) => {
      const next = new Set(prev);
      if (next.has(vehicleId)) next.delete(vehicleId);
      else next.add(vehicleId);
      return next;
    });
  };

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return documents.filter((d) => {
      if (typeFilter && d.type !== typeFilter) return false;
      if (!q) return true;
      const typeLabel = (documentTypeLabels[d.type] || "").toLowerCase();
      const haystack = [
        d.vehiclePlate, d.vehicleBrand, d.vehicleModel,
        d.name, typeLabel, d.uploadedByName,
      ].join(" ").toLowerCase();
      const words = q.split(/\s+/).filter(Boolean);
      return words.every((w) => haystack.includes(w));
    });
  }, [documents, query, typeFilter]);

  const hasActiveFilter = query.trim() !== "" || typeFilter !== "";

  const groups = useMemo(() => {
    const map = new Map<
      string,
      { plate: string; brand: string; model: string; vehicleId: string; docs: DocItem[] }
    >();
    for (const d of filtered) {
      if (!map.has(d.vehicleId)) {
        map.set(d.vehicleId, {
          plate: d.vehiclePlate,
          brand: d.vehicleBrand,
          model: d.vehicleModel,
          vehicleId: d.vehicleId,
          docs: [],
        });
      }
      map.get(d.vehicleId)!.docs.push(d);
    }
    return Array.from(map.values());
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Documenti</h1>
          <p className="text-muted-foreground">
            Archivio documenti della flotta — {filtered.length} document{filtered.length === 1 ? "o" : "i"}
            {groups.length > 0 && ` per ${groups.length} mezz${groups.length === 1 ? "o" : "i"}`}
          </p>
        </div>
        {canUpload && (
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {showForm ? <ChevronUp className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
            Carica documento
          </button>
        )}
      </div>

      {showForm && canUpload && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Carica nuovo documento</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setUploading(true);
                setUploadMsg({});
                const formData = new FormData(e.currentTarget);
                try {
                  const res = await fetch("/api/documents/upload", {
                    method: "POST",
                    body: formData,
                  });
                  const data = await res.json();
                  if (!res.ok) {
                    setUploadMsg({ error: data.error || "Errore durante il caricamento" });
                  } else {
                    setUploadMsg({ success: "Documento caricato!" });
                    (e.target as HTMLFormElement).reset();
                    router.refresh();
                  }
                } catch {
                  setUploadMsg({ error: "Errore di rete" });
                } finally {
                  setUploading(false);
                }
              }}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            >
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Mezzo *</label>
                <select name="vehicleId" required className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                  <option value="">Seleziona mezzo</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.plate}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Tipo *</label>
                <select name="type" required className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                  {allDocTypes.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">File PDF *</label>
                <input type="file" name="file" required accept=".pdf,application/pdf" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Note</label>
                <input type="text" name="notes" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
              </div>
              <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-3">
                <Button type="submit" disabled={uploading}>
                  {uploading ? "Caricamento..." : "Carica"}
                </Button>
                {uploadMsg.error && <p className="text-sm text-destructive">{uploadMsg.error}</p>}
                {uploadMsg.success && <p className="text-sm text-green-600">{uploadMsg.success}</p>}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca per targa, marca, modello, nome file o tipo..."
            className="w-full rounded-lg border bg-background pl-10 pr-3 py-2 text-sm"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border bg-background px-3 py-2 text-sm"
        >
          <option value="">Tutti i tipi</option>
          {allDocTypes.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        {(query || typeFilter) && (
          <Button variant="ghost" size="sm" onClick={() => { setQuery(""); setTypeFilter(""); }}>
            Azzera filtri
          </Button>
        )}
      </div>

      {/* Vehicle groups */}
      {groups.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="mx-auto mb-3 h-10 w-10 opacity-40" />
            <p>Nessun documento trovato</p>
            {(query || typeFilter) && (
              <p className="text-xs mt-1">Prova a modificare i criteri di ricerca</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => {
            const isOpen = hasActiveFilter || openVehicles.has(group.vehicleId);
            return (
              <Card key={group.vehicleId}>
                <button
                  type="button"
                  onClick={() => toggle(group.vehicleId)}
                  className="w-full text-left"
                >
                  <CardHeader className="py-4">
                    <CardTitle className="flex items-center gap-3 text-base font-normal">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                        <Truck className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-mono font-bold">{group.plate}</span>
                        <span className="ml-2 text-muted-foreground">
                          {group.brand} {group.model}
                        </span>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {group.docs.length} document{group.docs.length === 1 ? "o" : "i"}
                      </Badge>
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                    </CardTitle>
                  </CardHeader>
                </button>

                {isOpen && (
                  <CardContent className="pt-0 pb-4">
                    <div className="rounded-lg border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Dimensione</TableHead>
                            <TableHead>Caricato da</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead className="w-12">Scarica</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.docs.map((d) => (
                            <TableRow key={d.id}>
                              <TableCell>
                                <Badge variant="outline">
                                  {documentTypeLabels[d.type]}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                                  <span className="truncate max-w-xs">{d.name}</span>
                                </div>
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
                                <a href={`/api/documents/${d.id}/download`} target="_blank" rel="noopener noreferrer">
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </a>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="mt-2 text-right">
                      <Link href={`/mezzi/${group.vehicleId}`} className="text-xs text-primary hover:underline">
                        Vai al mezzo →
                      </Link>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
