import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MobiLog · SENAI Hub",
  description: "MobiLog: marcenaria e logística conectadas. Projeto Mundo SENAI.",
  manifest: "/manifest.webmanifest",
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
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
