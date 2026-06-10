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
import { cookieDomain } from "@/lib/host";

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
  // Share the session cookie across the portal + app subdomains so a single
  // login works on both biggym.<base> and app.biggym.<base>. In local dev
  // (http://app.localhost) drop the Secure/domain bits so the cookie sticks.
  cookies: {
    sessionToken:
      process.env.NODE_ENV === "production"
        ? {
            name: "__Secure-authjs.session-token",
            options: {
              httpOnly: true,
              sameSite: "lax",
              path: "/",
              secure: true,
              domain: cookieDomain(),
            },
          }
        : {
            name: "authjs.session-token",
            options: { httpOnly: true, sameSite: "lax", path: "/", secure: false },
          },
  },
  providers,
  pages: {
    signIn: "/login",
    verifyRequest: "/login?check=email",
  },
  events: {
    // Fires when the adapter creates a new user (magic-link or Google first
    // sign-in) — send a courtesy welcome email regardless of method.
    async createUser({ user }) {
      if (!user.email) return;
      try {
        const { sendTenantMail } = await import("@/lib/mail");
        await sendTenantMail({
          to: user.email,
          subject: "Welcome to biggym",
          text:
            `Welcome to biggym!\n\n` +
            `Your account (${user.email}) is ready. You can sign in any time ` +
            `with this email — magic link, Google, or a password you set in ` +
            `Settings.`,
        });
      } catch {
        /* never block account creation on email failure */
      }
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.uid = user.id;
      return token;
    },
    async session({ session, token }) {
      // Keep the session minimal: identity only. The active gym + role are
      // resolved per request from the membership list + the active-gym cookie
      // (see lib/gym.currentContext), since a user can belong to many gyms.
      if (session.user) {
        session.user.id = (token.uid as string) ?? "";
      }
      return session;
    },
  },
});
