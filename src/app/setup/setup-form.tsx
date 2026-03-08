"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { setupAdminAction } from "@/lib/actions/setup-actions";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Truck, ShieldCheck } from "lucide-react";

export function SetupForm() {
  const [state, formAction] = useActionState(setupAdminAction, undefined);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      const timer = setTimeout(() => router.push("/login"), 2000);
      return () => clearTimeout(timer);
    }
  }, [state?.success, router]);

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary shadow-md">
          <Truck className="h-7 w-7 text-primary-foreground" />
        </div>
        <CardTitle className="text-2xl">Configurazione Iniziale</CardTitle>
        <CardDescription>
          Nessun utente trovato. Crea il primo account amministratore.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state?.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}
          {state?.success && (
            <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              {state.success}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              name="name"
              placeholder="Mario Rossi"
              required
              autoComplete="name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="admin@azienda.it"
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Minimo 6 caratteri"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              Questo account avrà il ruolo <strong>Amministratore</strong> con accesso completo al sistema.
            </span>
          </div>
          <SubmitButton className="w-full" pendingText="Creazione in corso...">
            Crea Account Admin
          </SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
