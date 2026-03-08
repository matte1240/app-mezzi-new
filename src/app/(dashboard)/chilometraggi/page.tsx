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

const sourceLabels: Record<string, string> = {
  MANUAL: "Manuale",
  REFUEL: "Rifornimento",
  MAINTENANCE: "Intervento",
};

export default async function ChilometraggiPage() {
  const user = await getSessionUser();

  const whereVehicle =
    user.role === "DRIVER" ? { assignedDriverId: user.id } : {};

  const readings = await prisma.mileageReading.findMany({
    where: { vehicle: whereVehicle },
    include: { vehicle: true, recordedBy: true },
    orderBy: { date: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Chilometraggi</h1>
        <p className="text-muted-foreground">
          Tutti i rilevamenti chilometrici
        </p>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Targa</TableHead>
              <TableHead>Km</TableHead>
              <TableHead>Sorgente</TableHead>
              <TableHead>Rilevato da</TableHead>
              <TableHead>Note</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {readings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nessun rilevamento
                </TableCell>
              </TableRow>
            ) : (
              readings.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    {r.date.toLocaleDateString("it-IT")}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/mezzi/${r.vehicleId}`}
                      className="font-mono font-semibold hover:underline"
                    >
                      {r.vehicle.plate}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono">
                    {r.km.toLocaleString("it-IT")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{sourceLabels[r.source]}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.recordedBy.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.notes || "—"}
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
