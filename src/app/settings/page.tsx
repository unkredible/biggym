import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { currentContext } from "@/lib/gym";
import SettingsForm from "./SettingsForm";
import PasswordForm from "./PasswordForm";
import LocationsManager from "./LocationsManager";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const ctx = await currentContext();
  if (!ctx) redirect("/login");

  const [user, gym] = await Promise.all([
    prisma.user.findUnique({
      where: { id: ctx.userId },
      select: { email: true, passwordHash: true },
    }),
    ctx.gymId
      ? prisma.gym.findUnique({
          where: { id: ctx.gymId },
          select: { name: true, appName: true, theme: true, themeMode: true, logoUrl: true, bannerUrl: true },
        })
      : null,
  ]);

  const isGymAdmin = ctx.role === "gym_admin";

  return (
    <main>
      <div className="row spread">
        <h1>Settings</h1>
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
          {ctx.role && (
            <div className="list-row">
              <span className="lr-icon">★</span>
              <span>Role</span>
              <span className="lr-value">{ctx.role}</span>
            </div>
          )}
        </div>
        <div style={{ marginTop: "0.85rem" }}>
          <PasswordForm hasPassword={!!user?.passwordHash} />
        </div>
      </div>

      {/* ---- Appearance (gym admin) ---- */}
      {isGymAdmin && gym && (
        <div className="section">
          <div className="section-label">Appearance — {gym.name}</div>
          <SettingsForm
            appName={gym.appName ?? ""}
            theme={gym.theme}
            themeMode={gym.themeMode}
            logoUrl={gym.logoUrl}
            bannerUrl={gym.bannerUrl}
          />
        </div>
      )}

      {/* ---- Locations (gym admin) ---- */}
      {isGymAdmin && (
        <div className="section">
          <div className="section-label">Locations</div>
          <LocationsManager />
        </div>
      )}

      {/* ---- Platform (super admin) ---- */}
      {ctx.isSuper && (
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
