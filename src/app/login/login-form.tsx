"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/actions/auth-actions";
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
import { Truck } from "lucide-react";

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, undefined);

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary shadow-md">
          <Truck className="h-7 w-7 text-primary-foreground" />
        </div>
        <CardTitle className="text-2xl">Gestione Mezzi</CardTitle>
        <CardDescription>
          Accedi per gestire la flotta aziendale
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state?.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="email@azienda.it"
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
              required
              autoComplete="current-password"
            />
          </div>
          <SubmitButton className="w-full" pendingText="Accesso in corso...">
            Accedi
          </SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
