import { currentContext } from "@/lib/gym";

export function isSuperAdmin(role: string | null | undefined): boolean {
  return role === "super_admin";
}

/** Returns the context only if the caller is a platform super admin. */
export async function requireSuperAdmin() {
  const ctx = await currentContext();
  if (!ctx || !isSuperAdmin(ctx.role)) return null;
  return ctx;
}
