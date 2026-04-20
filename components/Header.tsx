import Image from "next/image";
import Link from "next/link";
import { BookOpenCheck, Compass, Sparkles } from "lucide-react";
import { getSessionUser } from "@/lib/server-auth";
import { LogoutButton } from "@/components/LogoutButton";
import inspireLogo from "@/public/brand/inspire-logo-brand-blue.png";

export async function Header() {
  const user = await getSessionUser();

  return (
    <header className="no-print border-b border-border bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <Link href={user ? "/dashboard" : "/"} className="inline-flex items-center">
          <Image
            src={inspireLogo}
            alt="Inspire logo"
            className="h-11 w-auto"
            priority
          />
        </Link>

        {user ? (
          <nav className="flex flex-wrap items-center justify-end gap-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-primary transition hover:border-primary/30 hover:bg-primary/5"
            >
              <Compass className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              href="/history"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-primary transition hover:border-primary/30 hover:bg-primary/5"
            >
              <BookOpenCheck className="h-4 w-4" />
              History
            </Link>
            <Link
              href="/insights"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-primary transition hover:border-primary/30 hover:bg-primary/5"
            >
              <Sparkles className="h-4 w-4" />
              Insights
            </Link>
            <LogoutButton />
          </nav>
        ) : (
          <Link
            href="/unlock"
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-primary/30 hover:text-primary"
          >
            Unlock
          </Link>
        )}
      </div>
    </header>
  );
}
