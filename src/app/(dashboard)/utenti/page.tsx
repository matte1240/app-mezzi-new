import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/auth-utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { roleLabels } from "@/lib/labels";
import { UserFormDialog } from "@/components/users/user-form-dialog";

export default async function UtentiPage() {
  await checkRole("ADMIN");

  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { assignedVehicles: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Utenti</h1>
          <p className="text-muted-foreground">
            Gestione utenti del sistema
          </p>
        </div>
        <UserFormDialog mode="create" />
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Ruolo</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead>Mezzi assegnati</TableHead>
              <TableHead>Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Badge variant="outline">{roleLabels[u.role]}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={u.active ? "default" : "secondary"}>
                    {u.active ? "Attivo" : "Disabilitato"}
                  </Badge>
                </TableCell>
                <TableCell>{u._count.assignedVehicles}</TableCell>
                <TableCell>
                  <UserFormDialog
                    mode="edit"
                    user={{
                      id: u.id,
                      email: u.email,
                      name: u.name,
                      role: u.role,
                      active: u.active,
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
