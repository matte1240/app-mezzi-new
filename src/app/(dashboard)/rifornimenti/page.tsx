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
import Link from "next/link";
import { fuelLabels } from "@/lib/labels";

export default async function RifornimentiPage() {
  const user = await getSessionUser();

  const whereVehicle =
    user.role === "DRIVER" ? { assignedDriverId: user.id } : {};

  const refuelings = await prisma.refueling.findMany({
    where: { vehicle: whereVehicle },
    include: { vehicle: true, user: true },
    orderBy: { date: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Rifornimenti</h1>
        <p className="text-muted-foreground">
          Tutti i rifornimenti della flotta
        </p>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Targa</TableHead>
              <TableHead>Km</TableHead>
              <TableHead>Litri</TableHead>
              <TableHead>Costo</TableHead>
              <TableHead>€/L</TableHead>
              <TableHead>Carburante</TableHead>
              <TableHead>Stazione</TableHead>
              <TableHead>Operatore</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {refuelings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  Nessun rifornimento
                </TableCell>
              </TableRow>
            ) : (
              refuelings.map((r) => (
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
                  <TableCell>{Number(r.liters).toFixed(2)}</TableCell>
                  <TableCell>€{Number(r.costEur).toFixed(2)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    €{(Number(r.costEur) / Number(r.liters)).toFixed(3)}
                  </TableCell>
                  <TableCell>{fuelLabels[r.fuelType]}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.station || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.user.name}
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
