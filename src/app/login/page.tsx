import { redirect } from "next/navigation";
import { checkNeedsSetup } from "@/lib/actions/setup-actions";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const needsSetup = await checkNeedsSetup();
  if (needsSetup) {
    redirect("/setup");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent">
      <LoginForm />
    </div>
  );
}
