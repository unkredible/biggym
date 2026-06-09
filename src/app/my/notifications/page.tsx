import { redirect } from "next/navigation";
import { currentClient, clientUpcomingBookings } from "@/lib/gym";

export const dynamic = "force-dynamic";

function timeLabel(d: Date) {
  return `${d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })} · ${d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
}

export default async function NotificationsPage() {
  const client = await currentClient();
  if (!client) redirect("/dashboard");
  const items = await clientUpcomingBookings(client.id);

  return (
    <main>
      <div className="row spread">
        <h1>Notifiche</h1>
        <a href="/dashboard">← dashboard</a>
      </div>

      {items.length === 0 ? (
        <p className="muted">Nessuna notifica. Iscriviti a un evento dal calendario 📅</p>
      ) : (
        <div className="list">
          {items.map((b) => (
            <div className="list-row" key={b.id}>
              <span className="lr-icon">{b.soon ? "⏰" : "📅"}</span>
              <span>
                <strong>{b.soon ? "Tra poco: " : ""}{b.title}</strong>
                <br />
                <span className="muted">
                  {timeLabel(b.when)}
                  {b.location ? ` · ${b.location}` : ""}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
