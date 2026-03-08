import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { maintenanceTypeLabels } from "@/lib/labels";

export default async function InterventiPage() {
  const user = await getSessionUser();

  const whereVehicle =
    user.role === "DRIVER" ? { assignedDriverId: user.id } : {};

  const interventions = await prisma.maintenanceIntervention.findMany({
    where: { vehicle: whereVehicle },
    include: { vehicle: true, user: true },
    orderBy: { date: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Interventi</h1>
        <p className="text-muted-foreground">
          Tutti gli interventi di manutenzione
        </p>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Targa</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Km</TableHead>
              <TableHead>Costo</TableHead>
              <TableHead>Officina</TableHead>
              <TableHead>Descrizione</TableHead>
              <TableHead>Operatore</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {interventions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Nessun intervento
                </TableCell>
              </TableRow>
            ) : (
              interventions.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    {m.date.toLocaleDateString("it-IT")}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/mezzi/${m.vehicleId}`}
                      className="font-mono font-semibold hover:underline"
                    >
                      {m.vehicle.plate}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {maintenanceTypeLabels[m.type]}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono">
                    {m.km.toLocaleString("it-IT")}
                  </TableCell>
                  <TableCell>
                    {m.costEur ? `€${Number(m.costEur).toFixed(2)}` : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {m.garage || "—"}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {m.description}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {m.user.name}
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
