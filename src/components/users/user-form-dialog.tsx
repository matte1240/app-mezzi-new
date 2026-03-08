"use client";

import { useActionState } from "react";
import { useState } from "react";
import { createUser, updateUser } from "@/lib/actions/user-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SubmitButton } from "@/components/ui/submit-button";
import { Plus, Pencil } from "lucide-react";

type UserData = {
  id: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
};

export function UserFormDialog({
  mode,
  user,
}: {
  mode: "create" | "edit";
  user?: UserData;
}) {
  const [open, setOpen] = useState(false);

  const action =
    mode === "edit" && user
      ? updateUser.bind(null, user.id)
      : createUser;

  const [state, formAction] = useActionState(action, undefined);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {mode === "create" ? (
        <DialogTrigger render={<Button />}>
          <Plus className="mr-2 h-4 w-4" />
          Nuovo Utente
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button variant="ghost" size="sm" />}>
          <Pencil className="mr-2 h-4 w-4" />
          Modifica
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Nuovo Utente" : `Modifica ${user?.name}`}
          </DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {state?.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}
          {state?.success && (
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
              Utente salvato
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              name="name"
              defaultValue={user?.name || ""}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={user?.email || ""}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">
              Password {mode === "edit" ? "(lascia vuoto per non cambiare)" : "*"}
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              required={mode === "create"}
              minLength={6}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Ruolo *</Label>
            <select
              id="role"
              name="role"
              defaultValue={user?.role || "DRIVER"}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              required
            >
              <option value="ADMIN">Amministratore</option>
              <option value="FLEET_MANAGER">Fleet Manager</option>
              <option value="DRIVER">Autista</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input type="hidden" name="active" value="false" />
            <input
              type="checkbox"
              id="active"
              name="active"
              value="true"
              defaultChecked={user?.active ?? true}
              className="h-4 w-4"
            />
            <Label htmlFor="active">Attivo</Label>
          </div>
          <SubmitButton className="w-full" pendingText="Salvataggio...">
            Salva
          </SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
