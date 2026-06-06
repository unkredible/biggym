import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Account settings now live under /settings.
export default function AccountRedirect() {
  redirect("/settings");
}
