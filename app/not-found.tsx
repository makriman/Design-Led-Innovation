import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotFound() {
  return (
    <section className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Page not found</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-lg text-slate-700">That lesson or page could not be found.</p>
          <Link href="/dashboard" className={buttonVariants()}>
            Back to dashboard
          </Link>
        </CardContent>
      </Card>
    </section>
  );
}
