"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteUser } from "@/lib/actions/user-actions";

export function DeleteUserButton({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  return (
    <form
      action={async () => {
        if (!confirm(`Eliminare definitivamente l'utente ${userName}?`)) {
          return;
        }

        const result = await deleteUser(userId);
        if (result?.error) {
          alert(result.error);
          return;
        }

        window.location.reload();
      }}
    >
      <Button type="submit" variant="destructive" size="sm">
        <Trash2 className="mr-2 h-4 w-4" />
        Elimina
      </Button>
    </form>
  );
}
