import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { isSuperAdmin } from "@/lib/admin";
import SettingsForm from "./SettingsForm";
import PasswordForm from "./PasswordForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [user, membership] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, passwordHash: true },
    }),
    prisma.membership.findUnique({
      where: { userId: session.user.id },
      include: {
        gym: {
          select: { name: true, appName: true, theme: true, themeMode: true, logoUrl: true },
        },
      },
    }),
  ]);

  const isGymAdmin = membership?.role === "gym_admin";
  const superAdmin = isSuperAdmin(session.user.role);

  return (
    <main>
      <div className="row spread">
        <h1>Settings</h1>
        <a href="/dashboard">← dashboard</a>
      </div>

      {/* ---- Account (everyone) ---- */}
      <div className="section">
        <div className="section-label">Account</div>
        <div className="list">
          <div className="list-row">
            <span className="lr-icon">@</span>
            <span>Email</span>
            <span className="lr-value">{user?.email}</span>
          </div>
          {membership && (
            <div className="list-row">
              <span className="lr-icon">★</span>
              <span>Role</span>
              <span className="lr-value">{membership.role}</span>
            </div>
          )}
        </div>
        <div style={{ marginTop: "0.85rem" }}>
          <PasswordForm hasPassword={!!user?.passwordHash} />
        </div>
      </div>

      {/* ---- Appearance (gym admin) ---- */}
      {isGymAdmin && membership?.gym && (
        <div className="section">
          <div className="section-label">Appearance</div>
          <SettingsForm
            appName={membership.gym.appName ?? ""}
            theme={membership.gym.theme}
            themeMode={membership.gym.themeMode}
            logoUrl={membership.gym.logoUrl}
          />
        </div>
      )}

      {/* ---- Platform (super admin) ---- */}
      {superAdmin && (
        <div className="section">
          <div className="section-label">Platform</div>
          <div className="list">
            <a className="list-row" href="/admin">
              <span className="lr-icon">⚙</span>
              <span>Platform admin</span>
              <span className="lr-value lr-chev">→</span>
            </a>
          </div>
        </div>
      )}
    </main>
  );
}
