import { redirect } from "next/navigation";
import { currentContext } from "@/lib/gym";
import PlansManager from "./PlansManager";

export const dynamic = "force-dynamic";

export default async function PlansPage() {
  const ctx = await currentContext();
  if (!ctx) redirect("/login");
  if (!ctx.gymId || !(ctx.isSuper || ctx.role === "gym_admin")) redirect("/dashboard");

  return (
    <main>
      <div className="row spread">
        <h1>Plans</h1>
      </div>
      <p className="muted">Subscription plans clients can be assigned to. Events can target a single plan.</p>
      <PlansManager />
    </main>
  );
}
