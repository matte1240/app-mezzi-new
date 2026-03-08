import { redirect } from "next/navigation";
import { checkNeedsSetup } from "@/lib/actions/setup-actions";
import { SetupForm } from "./setup-form";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const needsSetup = await checkNeedsSetup();
  if (!needsSetup) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent">
      <SetupForm />
    </div>
  );
}
