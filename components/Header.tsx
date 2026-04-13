import Link from "next/link";
import { Lightbulb } from "lucide-react";
import { getSessionUser } from "@/lib/server-auth";
import { LogoutButton } from "@/components/LogoutButton";

export async function Header() {
  const user = await getSessionUser();

  return (
    <header className="no-print border-b border-border bg-neutral">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2 text-primary">
          <Lightbulb className="h-6 w-6" />
          <span className="text-2xl font-extrabold tracking-tight">Inspire</span>
        </Link>

        {user ? (
          <nav className="flex flex-wrap items-center justify-end gap-2">
            <Link href="/dashboard" className="rounded-lg px-3 py-2 font-semibold text-primary hover:bg-white/80">
              Dashboard
            </Link>
            <Link href="/history" className="rounded-lg px-3 py-2 font-semibold text-primary hover:bg-white/80">
              History
            </Link>
            <Link href="/insights" className="rounded-lg px-3 py-2 font-semibold text-primary hover:bg-white/80">
              Insights
            </Link>
            <LogoutButton />
          </nav>
        ) : (
          <nav className="flex flex-wrap items-center justify-end gap-2">
            <Link href="/login" className="rounded-lg px-3 py-2 font-semibold text-primary hover:bg-white/80">
              Login
            </Link>
            <Link href="/signup" className="rounded-lg bg-primary px-4 py-2 font-semibold text-white hover:bg-primary/90">
              Sign up
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
