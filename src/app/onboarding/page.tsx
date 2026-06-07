import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import OnboardingForm from "./OnboardingForm";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const membership = await prisma.membership.findUnique({
    where: { userId: session.user.id },
  });
  if (membership) redirect("/dashboard");

  return (
    <main>
      <h1>Set up your gym</h1>
      <p className="muted">
        Signed in as <code>{session.user.email}</code>. Choose a password and
        your gym name, then complete payment.
      </p>
      <OnboardingForm />
    </main>
  );
}
