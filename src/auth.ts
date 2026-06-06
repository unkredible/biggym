/**
 * biggym Auth.js (NextAuth v5) — three sign-in methods:
 *   - Credentials (email + password)
 *   - Nodemailer magic-link (passwordless email)
 *   - Google OAuth (when GOOGLE_CLIENT_* are set)
 *
 * Sessions use the JWT strategy (required for the Credentials provider). The
 * Prisma adapter still backs users/accounts/verification tokens, so magic-link
 * and Google account-linking keep working. The signed-in user's gym + role are
 * resolved from their Membership and embedded in the token/session.
 */

import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Nodemailer from "next-auth/providers/nodemailer";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";

const smtpPort = Number.parseInt(process.env.SMTP_PORT ?? "587", 10);

const providers: NextAuthConfig["providers"] = [
  Credentials({
    name: "Email & password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(creds) {
      const email = String(creds?.email ?? "").trim().toLowerCase();
      const password = String(creds?.password ?? "");
      if (!email || !password) return null;
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user?.passwordHash) return null;
      const ok = await verifyPassword(password, user.passwordHash);
      if (!ok) return null;
      return { id: user.id, email: user.email, name: user.name };
    },
  }),
  Nodemailer({
    server: {
      host: process.env.SMTP_HOST,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    },
    from: process.env.EMAIL_FROM ?? process.env.SMTP_USER,
    maxAge: 30 * 60,
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  session: { strategy: "jwt" },
  providers,
  pages: {
    signIn: "/login",
    verifyRequest: "/login?check=email",
  },
  callbacks: {
    async jwt({ token, user }) {
      // On sign-in, resolve the user's gym + role once and cache in the token.
      if (user?.id) {
        token.uid = user.id;
        const m = await prisma.membership.findUnique({
          where: { userId: user.id },
          select: { gymId: true, role: true },
        });
        token.gymId = m?.gymId ?? null;
        token.role = m?.role ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const uid = (token.uid as string) ?? "";
        session.user.id = uid;
        // Resolve membership fresh each session read so a gym/role assigned
        // after sign-in (e.g. right after subscribing) shows up without a
        // re-login. Falls back to the token's cached values.
        let gymId = (token.gymId as string | null) ?? null;
        let role = (token.role as string | null) ?? null;
        if (uid && !gymId) {
          const m = await prisma.membership.findUnique({
            where: { userId: uid },
            select: { gymId: true, role: true },
          });
          if (m) {
            gymId = m.gymId;
            role = m.role;
          }
        }
        // Platform owners (SUPERADMIN_EMAILS) always get the super_admin role,
        // regardless of any gym membership.
        const supers = (process.env.SUPERADMIN_EMAILS ?? "")
          .toLowerCase()
          .split(/[,\s]+/)
          .filter(Boolean);
        if (session.user.email && supers.includes(session.user.email.toLowerCase())) {
          role = "super_admin";
        }

        session.user.gymId = gymId;
        session.user.role = role;
      }
      return session;
    },
  },
});
