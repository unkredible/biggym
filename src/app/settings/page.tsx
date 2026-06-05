import { redirect } from "next/navigation";
import { currentContext } from "@/lib/gym";
import { prisma } from "@/lib/db";
import BrandingForm from "./BrandingForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const ctx = await currentContext();
  if (!ctx) redirect("/login");
  if (!ctx.gymId || ctx.role !== "gym_admin") redirect("/dashboard");

  const gym = await prisma.gym.findUnique({
    where: { id: ctx.gymId },
    select: {
      name: true,
      appName: true,
      primaryColor: true,
      accentColor: true,
      logoUrl: true,
    },
  });
  if (!gym) redirect("/dashboard");

  return (
    <main>
      <div className="row spread">
        <h1>Settings</h1>
        <a href="/dashboard">← dashboard</a>
      </div>
      <p className="muted">Branding for {gym.name}&apos;s app.</p>
      <BrandingForm
        appName={gym.appName ?? ""}
        primaryColor={gym.primaryColor}
        accentColor={gym.accentColor}
        logoUrl={gym.logoUrl ?? ""}
      />
    </main>
  );
}
