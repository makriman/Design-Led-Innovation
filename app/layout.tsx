import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";
import "@/lib/env";
import "@/lib/db";
import { Header } from "@/components/Header";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Inspire",
  description: "Play-based learning, ready in seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-neutral/40 text-foreground`}>
        <Header />
        <main className="mx-auto w-full max-w-5xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
