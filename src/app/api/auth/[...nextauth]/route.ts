import { handlers } from "@/auth";

// Auth.js needs the Node runtime: the Prisma adapter and the Nodemailer
// (magic-link) provider are not edge-compatible.
export const runtime = "nodejs";

export const { GET, POST } = handlers;
