import * as React from "react";
import { cn } from "@/lib/utils";

function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "min-h-12 w-full rounded-lg border border-border bg-white px-4 py-3 text-lg text-slate-900 outline-none ring-primary transition focus-visible:ring-2",
        className
      )}
      {...props}
    />
  );
}

export { Select };
