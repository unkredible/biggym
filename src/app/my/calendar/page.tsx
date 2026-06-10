import { redirect } from "next/navigation";
import { currentClient } from "@/lib/gym";
import { IconCalendar } from "@/components/icons";
import MyCalendar from "./MyCalendar";

export const dynamic = "force-dynamic";

export default async function MyCalendarPage() {
  const client = await currentClient();
  if (!client) redirect("/dashboard");

  return (
    <main>
      <div className="section-hero">
        <span className="sh-ic"><IconCalendar width={26} height={26} /></span>
        <div>
          <div className="sh-t">Calendario</div>
          <div className="sh-s">Classi ed eventi della tua palestra — iscriviti con un tap</div>
        </div>
      </div>
      <MyCalendar />
    </main>
  );
}
