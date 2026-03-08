import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, AlertTriangle, Clock, Fuel, Wrench } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { it } from "date-fns/locale";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getSessionUser();

  // Redirect to onboarding if no vehicles exist (ADMIN/FLEET_MANAGER only)
  if (user.role === "ADMIN" || user.role === "FLEET_MANAGER") {
    const vehicleExists = await prisma.vehicle.findFirst({ select: { id: true } });
    if (!vehicleExists) {
      redirect("/onboarding");
    }
  }

  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const whereVehicle =
    user.role === "DRIVER"
      ? { assignedDriverId: user.id }
      : {};

  const [
    vehicleCount,
    activeCount,
    maintenanceCount,
    overdueDeadlines,
    upcomingDeadlines,
    recentRefuelings,
    recentMaintenance,
  ] = await Promise.all([
    prisma.vehicle.count({ where: whereVehicle }),
    prisma.vehicle.count({ where: { ...whereVehicle, status: "ACTIVE" } }),
    prisma.vehicle.count({ where: { ...whereVehicle, status: "MAINTENANCE" } }),
    prisma.deadline.findMany({
      where: {
        completed: false,
        dueDate: { lt: now },
        vehicle: whereVehicle,
      },
      include: { vehicle: true },
      orderBy: { dueDate: "asc" },
      take: 10,
    }),
    prisma.deadline.findMany({
      where: {
        completed: false,
        dueDate: { gte: now, lte: in30Days },
        vehicle: whereVehicle,
      },
      include: { vehicle: true },
      orderBy: { dueDate: "asc" },
      take: 10,
    }),
    prisma.refueling.findMany({
      where: { vehicle: whereVehicle },
      include: { vehicle: true },
      orderBy: { date: "desc" },
      take: 5,
    }),
    prisma.maintenanceIntervention.findMany({
      where: { vehicle: whereVehicle },
      include: { vehicle: true },
      orderBy: { date: "desc" },
      take: 5,
    }),
  ]);

  const deadlineTypeLabels: Record<string, string> = {
    TAGLIANDO: "Tagliando",
    REVISIONE: "Revisione",
    ASSICURAZIONE: "Assicurazione",
    BOLLO: "Bollo",
    REVISIONE_TACHIGRAFO: "Rev. Tachigrafo",
    ALTRO: "Altro",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Benvenuto, {user.name}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/mezzi">
          <Card className="h-full transition-colors hover:bg-muted/50 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Mezzi Totali</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vehicleCount}</div>
              <p className="text-xs text-muted-foreground">
                {activeCount} attivi
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/mezzi?status=MAINTENANCE">
          <Card className="h-full transition-colors hover:bg-muted/50 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">In Manutenzione</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{maintenanceCount}</div>
              <p className="text-xs text-muted-foreground">&nbsp;</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/scadenze">
          <Card className="h-full transition-colors hover:bg-muted/50 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Scadenze Scadute</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {overdueDeadlines.length}
              </div>
              <p className="text-xs text-muted-foreground">&nbsp;</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/scadenze">
          <Card className="h-full transition-colors hover:bg-muted/50 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Prossime 30gg</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">
                {upcomingDeadlines.length}
              </div>
              <p className="text-xs text-muted-foreground">&nbsp;</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Deadlines */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Overdue */}
        <Link href="/scadenze?status=overdue">
          <Card className="h-full transition-colors hover:bg-muted/50 cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Scadenze Scadute
              </CardTitle>
              <CardDescription>Richiedono attenzione immediata</CardDescription>
            </CardHeader>
            <CardContent>
              {overdueDeadlines.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nessuna scadenza scaduta</p>
              ) : (
                <ul className="space-y-3">
                  {overdueDeadlines.map((d) => (
                    <li key={d.id} className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">
                          {d.vehicle.plate}
                        </span>
                        <span className="ml-2 text-sm text-muted-foreground">
                          {deadlineTypeLabels[d.type]}
                        </span>
                      </div>
                      <Badge variant="destructive">
                        Scaduta da {differenceInDays(now, d.dueDate)}gg
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </Link>

        {/* Upcoming */}
        <Link href="/scadenze?status=upcoming">
          <Card className="h-full transition-colors hover:bg-muted/50 cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-500">
                <Clock className="h-5 w-5" />
                Scadenze Prossime
              </CardTitle>
              <CardDescription>Nei prossimi 30 giorni</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingDeadlines.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nessuna scadenza imminente</p>
              ) : (
                <ul className="space-y-3">
                  {upcomingDeadlines.map((d) => (
                    <li key={d.id} className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">
                          {d.vehicle.plate}
                        </span>
                        <span className="ml-2 text-sm text-muted-foreground">
                          {deadlineTypeLabels[d.type]}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-orange-500 border-orange-500">
                        {format(d.dueDate, "dd MMM", { locale: it })}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Link href="/rifornimenti">
          <Card className="h-full transition-colors hover:bg-muted/50 cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fuel className="h-5 w-5" />
                Ultimi Rifornimenti
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentRefuelings.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nessun rifornimento</p>
              ) : (
                <ul className="space-y-3">
                  {recentRefuelings.map((r) => (
                    <li key={r.id} className="flex items-center justify-between text-sm">
                      <div>
                        <span className="font-medium">
                          {r.vehicle.plate}
                        </span>
                        <span className="ml-2 text-muted-foreground">
                          {format(r.date, "dd/MM/yy", { locale: it })}
                        </span>
                      </div>
                      <span>
                        {Number(r.liters)}L — €{Number(r.costEur).toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </Link>

        <Link href="/interventi">
          <Card className="h-full transition-colors hover:bg-muted/50 cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Ultimi Interventi
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentMaintenance.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nessun intervento</p>
              ) : (
                <ul className="space-y-3">
                  {recentMaintenance.map((m) => (
                    <li key={m.id} className="flex items-center justify-between text-sm">
                      <div>
                        <span className="font-medium">
                          {m.vehicle.plate}
                        </span>
                        <span className="ml-2 text-muted-foreground">
                          {m.description.substring(0, 40)}
                          {m.description.length > 40 ? "..." : ""}
                        </span>
                      </div>
                      <span className="text-muted-foreground">
                        {format(m.date, "dd/MM/yy", { locale: it })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
