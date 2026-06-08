import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import OnboardingForm from "./OnboardingForm";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [membership, me] = await Promise.all([
    prisma.membership.findUnique({ where: { userId: session.user.id } }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    }),
  ]);
  if (membership) redirect("/dashboard");

  const hasPassword = !!me?.passwordHash;

  return (
    <main>
      <h1>Set up your gym</h1>
      <p className="muted">
        Signed in as <code>{session.user.email}</code>.{" "}
        {hasPassword
          ? "Name your gym, then complete payment."
          : "Choose a password and your gym name, then complete payment."}
      </p>
      <OnboardingForm hasPassword={hasPassword} />
    </main>
  );
}
