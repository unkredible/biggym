import { redirect } from "next/navigation";
import { IconUsers } from "@/components/icons";
import { currentContext, isStaffRole } from "@/lib/gym";
import PeopleManager from "./PeopleManager";

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  const ctx = await currentContext();
  if (!ctx) redirect("/login");
  if (!ctx.gymId || !isStaffRole(ctx.role)) redirect("/dashboard");

  return (
    <main>
      <div className="section-hero">
        <span className="sh-ic"><IconUsers width={26} height={26} /></span>
        <div>
          <div className="sh-t">Persone</div>
          <div className="sh-s">Staff e clienti, raggruppati per permesso</div>
        </div>
      </div>
      <PeopleManager />
    </main>
  );
}
