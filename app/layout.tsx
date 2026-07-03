import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clinix EMR",
  description: "A solo-clinic EMR focused on fast consults, prescriptions, certificates, and patient access.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
