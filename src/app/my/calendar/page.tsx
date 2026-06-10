import { redirect } from "next/navigation";
import { currentClient } from "@/lib/gym";
import MyCalendar from "./MyCalendar";

export const dynamic = "force-dynamic";

export default async function MyCalendarPage() {
  const client = await currentClient();
  if (!client) redirect("/dashboard");

  return (
    <main>
      <div className="row spread">
        <h1>Calendar</h1>
      </div>
      <p className="muted">Browse classes &amp; events and sign up. Events outside your plan are shown but not bookable.</p>
      <MyCalendar />
    </main>
  );
}
