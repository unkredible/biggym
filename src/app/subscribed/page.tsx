import { appBaseUrl } from "@/lib/host";

export const dynamic = "force-dynamic";

export default function SubscribedPage() {
  return (
    <main>
      <h1>You&apos;re in 🎉</h1>
      <p>
        Payment received. We&apos;ve emailed a sign-in link to the address you
        used. Your gym workspace is being set up.
      </p>
      <p>
        <a href={`${appBaseUrl()}/login`}>Go to your app →</a>
      </p>
      <p className="muted">
        Didn&apos;t get the email within a minute? Check spam, or just open the
        app and request a magic link with the same address.
      </p>
    </main>
  );
}
