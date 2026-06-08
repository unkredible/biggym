import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import OnboardingForm from "./OnboardingForm";

export const dynamic = "force-dynamic";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: { name?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });
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
      <OnboardingForm hasPassword={hasPassword} defaultName={searchParams.name ?? ""} />
    </main>
  );
}
