import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "biggym",
  description: "Gym management made simple — clients, workout programs, billing.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
