import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import AcceptButton from "./AcceptButton";

export const dynamic = "force-dynamic";

export default async function StaffAcceptPage({
  params,
}: {
  params: { token: string };
}) {
  const invite = await prisma.staffInvite.findUnique({
    where: { token: params.token },
    include: { gym: true },
  });

  if (!invite || invite.expiresAt < new Date()) {
    return (
      <main>
        <h1>Invitation</h1>
        <p>This staff invitation is invalid or expired.</p>
      </main>
    );
  }
  if (invite.acceptedAt) {
    return (
      <main>
        <h1>Already accepted</h1>
        <p>
          This invitation was already accepted. <a href="/dashboard">Go to dashboard →</a>
        </p>
      </main>
    );
  }

  const session = await auth();
  const signedInRight =
    session?.user?.email?.toLowerCase() === invite.email.toLowerCase();

  return (
    <main>
      <h1>Join {invite.gym.name}</h1>
      <p className="muted">
        Role <code>{invite.role}</code> · invite for <code>{invite.email}</code>
      </p>

      {signedInRight ? (
        <AcceptButton token={params.token} gymName={invite.gym.name} />
      ) : (
        <div className="card">
          <p>
            Sign in with <strong>{invite.email}</strong> to accept this invite.
          </p>
          <a
            href={`/login?callbackUrl=${encodeURIComponent(`/staff/accept/${params.token}`)}`}
          >
            <button className="primary">Sign in</button>
          </a>
        </div>
      )}
    </main>
  );
}
