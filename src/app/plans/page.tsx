import { redirect } from "next/navigation";
import { IconTag } from "@/components/icons";
import { currentContext } from "@/lib/gym";
import PlansManager from "./PlansManager";

export const dynamic = "force-dynamic";

export default async function PlansPage() {
  const ctx = await currentContext();
  if (!ctx) redirect("/login");
  if (!ctx.gymId || !(ctx.isSuper || ctx.role === "gym_admin")) redirect("/dashboard");

  return (
    <main>
      <div className="section-hero">
        <span className="sh-ic"><IconTag width={26} height={26} /></span>
        <div>
          <div className="sh-t">Piani</div>
          <div className="sh-s">Abbonamenti assegnabili ai clienti; gli eventi possono mirarli</div>
        </div>
      </div>
      <PlansManager />
    </main>
  );
}
