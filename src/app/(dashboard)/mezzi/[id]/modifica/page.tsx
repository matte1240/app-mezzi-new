import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/auth-utils";
import { updateVehicle } from "@/lib/actions/vehicle-actions";
import { VehicleForm } from "@/components/vehicles/vehicle-form";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function ModificaMezzoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await checkRole("ADMIN");
  const { id } = await params;

  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) notFound();

  const drivers = await prisma.user.findMany({
    where: { role: "DRIVER", active: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const boundAction = updateVehicle.bind(null, id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/mezzi/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">
          Modifica {vehicle.plate}
        </h1>
      </div>
      <VehicleForm
        action={boundAction}
        defaultValues={vehicle}
        drivers={drivers}
        submitLabel="Salva Modifiche"
      />
    </div>
  );
}
