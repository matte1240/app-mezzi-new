import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/auth-utils";
import { createVehicle } from "@/lib/actions/vehicle-actions";
import { VehicleForm } from "@/components/vehicles/vehicle-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function NuovoMezzoPage() {
  await checkRole("ADMIN", "FLEET_MANAGER");

  const drivers = await prisma.user.findMany({
    where: { role: "DRIVER", active: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/mezzi">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Nuovo Mezzo</h1>
      </div>
      <VehicleForm
        action={createVehicle}
        drivers={drivers}
        submitLabel="Crea Mezzo"
      />
    </div>
  );
}
