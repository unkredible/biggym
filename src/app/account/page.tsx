import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import PasswordForm from "./PasswordForm";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, passwordHash: true },
  });

  return (
    <main>
      <div className="row spread">
        <h1>Account</h1>
        <a href="/dashboard">← dashboard</a>
      </div>
      <p className="muted">
        Signed in as <code>{user?.email}</code>
      </p>
      <PasswordForm hasPassword={!!user?.passwordHash} />
    </main>
  );
}
