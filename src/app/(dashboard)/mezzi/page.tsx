import { prisma } from "@/lib/prisma";
import { getSessionUser, canManageVehicles } from "@/lib/auth-utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";
import {
  ownershipLabels,
  statusLabels,
  fuelLabels,
  statusColors,
} from "@/lib/labels";

export default async function MezziPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; ownership?: string; q?: string }>;
}) {
  const user = await getSessionUser();
  const params = await searchParams;
  const canManage = canManageVehicles(user.role);

  const where: Record<string, unknown> = {};

  if (user.role === "DRIVER") {
    where.assignedDriverId = user.id;
  }
  if (params.status) {
    where.status = params.status;
  }
  if (params.ownership) {
    where.ownershipType = params.ownership;
  }
  if (params.q) {
    where.OR = [
      { plate: { contains: params.q, mode: "insensitive" } },
      { brand: { contains: params.q, mode: "insensitive" } },
      { model: { contains: params.q, mode: "insensitive" } },
    ];
  }

  const vehicles = await prisma.vehicle.findMany({
    where,
    include: { assignedDriver: true },
    orderBy: { plate: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mezzi</h1>
          <p className="text-muted-foreground">
            {vehicles.length} mezz{vehicles.length === 1 ? "o" : "i"} trovati
          </p>
        </div>
        {canManage && (
          <Link href="/mezzi/nuovo">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuovo Mezzo
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-3">
        <input
          name="q"
          placeholder="Cerca targa, marca, modello..."
          defaultValue={params.q || ""}
          className="rounded-md border bg-background px-3 py-2 text-sm w-64"
        />
        <select
          name="status"
          defaultValue={params.status || ""}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="">Tutti gli stati</option>
          <option value="ACTIVE">Attivo</option>
          <option value="INACTIVE">Inattivo</option>
          <option value="MAINTENANCE">In manutenzione</option>
        </select>
        <select
          name="ownership"
          defaultValue={params.ownership || ""}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="">Tutti i tipi</option>
          <option value="OWNED">Proprietà</option>
          <option value="RENTED">Noleggio</option>
          <option value="LEASED">Leasing</option>
        </select>
        <Button type="submit" variant="secondary" size="sm">
          Filtra
        </Button>
      </form>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Targa</TableHead>
              <TableHead>Marca / Modello</TableHead>
              <TableHead>Anno</TableHead>
              <TableHead>Carburante</TableHead>
              <TableHead>Proprietà</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead>Assegnato a</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nessun mezzo trovato
                </TableCell>
              </TableRow>
            ) : (
              vehicles.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>
                    <Link
                      href={`/mezzi/${v.id}`}
                      className="font-mono font-semibold hover:underline"
                    >
                      {v.plate}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {v.brand} {v.model}
                  </TableCell>
                  <TableCell>{v.year}</TableCell>
                  <TableCell>{fuelLabels[v.fuelType]}</TableCell>
                  <TableCell>{ownershipLabels[v.ownershipType]}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[v.status]}>
                      {statusLabels[v.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {v.assignedDriver ? v.assignedDriver.name : (
                      <span className="text-muted-foreground">Pool</span>
                    )}
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
