"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Button } from "@/components/ui/button";
import {
  Truck,
  UserPlus,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Rocket,
} from "lucide-react";
import { onboardingCreateVehicle, onboardingCreateUser } from "@/lib/actions/onboarding-actions";

type Step = "welcome" | "vehicle" | "user" | "done";

const STEPS: { key: Step; label: string }[] = [
  { key: "welcome", label: "Benvenuto" },
  { key: "vehicle", label: "Primo Mezzo" },
  { key: "user", label: "Primo Utente" },
  { key: "done", label: "Completato" },
];

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>("welcome");
  const [vehicleAdded, setVehicleAdded] = useState(false);
  const [userAdded, setUserAdded] = useState(false);
  const router = useRouter();

  const currentIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-2xl space-y-6">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                  i < currentIndex
                    ? "bg-primary text-primary-foreground"
                    : i === currentIndex
                    ? "bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i < currentIndex ? "✓" : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-0.5 w-8 sm:w-12 ${
                    i < currentIndex ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {step === "welcome" && <WelcomeStep onNext={() => setStep("vehicle")} />}
        {step === "vehicle" && (
          <VehicleStep
            onNext={() => {
              setStep("user");
            }}
            onSuccess={() => setVehicleAdded(true)}
            vehicleAdded={vehicleAdded}
          />
        )}
        {step === "user" && (
          <UserStep
            onNext={() => setStep("done")}
            onBack={() => setStep("vehicle")}
            onSuccess={() => setUserAdded(true)}
            userAdded={userAdded}
          />
        )}
        {step === "done" && <DoneStep />}
      </div>
    </div>
  );
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <Card className="shadow-lg">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-md">
          <Rocket className="h-8 w-8 text-primary-foreground" />
        </div>
        <CardTitle className="text-2xl">Benvenuto in Gestione Mezzi!</CardTitle>
        <CardDescription className="text-base mt-2">
          Configura la tua flotta aziendale in pochi semplici passaggi.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <FeatureCard
            icon={<Truck className="h-5 w-5" />}
            title="Mezzi"
            description="Aggiungi i veicoli della tua flotta"
          />
          <FeatureCard
            icon={<UserPlus className="h-5 w-5" />}
            title="Utenti"
            description="Invita autisti e fleet manager"
          />
          <FeatureCard
            icon={<CheckCircle2 className="h-5 w-5" />}
            title="Scadenze"
            description="Monitora tagliandi, revisioni e assicurazioni"
          />
        </div>
        <div className="flex justify-center">
          <Button type="button" onClick={onNext} className="gap-2">
            Iniziamo <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border p-4 text-center space-y-2">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="font-medium text-sm">{title}</h3>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function VehicleStep({
  onNext,
  onSuccess,
  vehicleAdded,
}: {
  onNext: () => void;
  onSuccess: () => void;
  vehicleAdded: boolean;
}) {
  const [state, formAction] = useActionState(
    async (
      prev: { error?: string; success?: boolean } | undefined,
      formData: FormData
    ) => {
      const result = await onboardingCreateVehicle(prev, formData);
      if (result?.success) onSuccess();
      return result;
    },
    undefined
  );

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Aggiungi il primo mezzo</CardTitle>
            <CardDescription>
              Inserisci i dati del primo veicolo della flotta
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {state?.error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {state.error}
          </div>
        )}
        {(state?.success || vehicleAdded) && (
          <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Mezzo aggiunto con successo!
          </div>
        )}

        {!vehicleAdded ? (
          <form action={formAction} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="plate">Targa *</Label>
                <Input
                  id="plate"
                  name="plate"
                  placeholder="AA000BB"
                  required
                  className="uppercase"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vin">Telaio (VIN)</Label>
                <Input id="vin" name="vin" placeholder="Opzionale" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="brand">Marca *</Label>
                <Input id="brand" name="brand" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Modello *</Label>
                <Input id="model" name="model" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Anno *</Label>
                <Input
                  id="year"
                  name="year"
                  type="number"
                  defaultValue={new Date().getFullYear()}
                  required
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fuelType">Carburante *</Label>
                <select
                  id="fuelType"
                  name="fuelType"
                  defaultValue="DIESEL"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="DIESEL">Diesel</option>
                  <option value="GASOLINE">Benzina</option>
                  <option value="ELECTRIC">Elettrico</option>
                  <option value="HYBRID">Ibrido</option>
                  <option value="LPG">GPL</option>
                  <option value="CNG">Metano</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ownershipType">Tipo Proprietà *</Label>
                <select
                  id="ownershipType"
                  name="ownershipType"
                  defaultValue="OWNED"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="OWNED">Proprietà</option>
                  <option value="RENTED">Noleggio</option>
                  <option value="LEASED">Leasing</option>
                </select>
              </div>
            </div>
            <div className="flex justify-between">
              <div />
              <SubmitButton pendingText="Salvataggio..." className="gap-2">
                Aggiungi Mezzo <CheckCircle2 className="h-4 w-4" />
              </SubmitButton>
            </div>
          </form>
        ) : (
          <div className="flex justify-end">
            <Button type="button" onClick={onNext} className="gap-2">
              Avanti <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function UserStep({
  onNext,
  onBack,
  onSuccess,
  userAdded,
}: {
  onNext: () => void;
  onBack: () => void;
  onSuccess: () => void;
  userAdded: boolean;
}) {
  const [state, formAction] = useActionState(
    async (
      prev: { error?: string; success?: boolean } | undefined,
      formData: FormData
    ) => {
      const result = await onboardingCreateUser(prev, formData);
      if (result?.success) onSuccess();
      return result;
    },
    undefined
  );

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Aggiungi un utente</CardTitle>
            <CardDescription>
              Crea un account per un autista o fleet manager (opzionale)
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {state?.error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {state.error}
          </div>
        )}
        {(state?.success || userAdded) && (
          <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Utente creato con successo!
          </div>
        )}

        {!userAdded ? (
          <form action={formAction} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input id="name" name="name" placeholder="Mario Rossi" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="mario@azienda.it"
                  required
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Minimo 6 caratteri"
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Ruolo *</Label>
                <select
                  id="role"
                  name="role"
                  defaultValue="DRIVER"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="DRIVER">Autista</option>
                  <option value="FLEET_MANAGER">Fleet Manager</option>
                  <option value="ADMIN">Amministratore</option>
                </select>
              </div>
            </div>
            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={onBack} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Indietro
              </Button>
              <SubmitButton pendingText="Creazione..." className="gap-2">
                Crea Utente <CheckCircle2 className="h-4 w-4" />
              </SubmitButton>
            </div>
          </form>
        ) : (
          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={onBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Indietro
            </Button>
            <Button type="button" onClick={onNext} className="gap-2">
              Avanti <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {!userAdded && (
          <div className="text-center">
            <button
              type="button"
              onClick={onNext}
              className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
            >
              Salta questo passaggio
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DoneStep() {
  const router = useRouter();

  return (
    <Card className="shadow-lg">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 shadow-md">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <CardTitle className="text-2xl">Tutto pronto!</CardTitle>
        <CardDescription className="text-base mt-2">
          La configurazione iniziale è completata. Puoi ora iniziare a gestire la tua flotta.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
          <p className="font-medium">Prossimi passi consigliati:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Aggiungi altri veicoli dalla sezione Mezzi</li>
            <li>Configura le scadenze per ogni mezzo</li>
            <li>Invita altri utenti dalla sezione Utenti</li>
            <li>Registra i primi chilometraggi e rifornimenti</li>
          </ul>
        </div>
        <div className="flex justify-center">
          <Button type="button" onClick={() => router.push("/")} className="gap-2">
            Vai alla Dashboard <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
