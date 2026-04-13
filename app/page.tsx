import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionUser } from "@/lib/server-auth";
import { cn } from "@/lib/utils";

export default async function HomePage() {
  const user = await getSessionUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Inspire</CardTitle>
          <p className="text-xl text-slate-700">Play-based learning, ready in seconds.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-lg text-slate-800">
            Generate 3 classroom games, run them, then log what worked so your next lesson gets better.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signup"
              className={cn(buttonVariants({ variant: "accent", size: "lg" }), "w-full sm:w-auto")}
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full sm:w-auto")}
            >
              Log In
            </Link>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
