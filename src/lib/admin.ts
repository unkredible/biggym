import { currentContext } from "@/lib/gym";

/** Returns the context only if the caller is a platform super admin. */
export async function requireSuperAdmin() {
  const ctx = await currentContext();
  if (!ctx || !ctx.isSuper) return null;
  return ctx;
}
