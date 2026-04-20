import * as React from "react";
import { cn } from "@/lib/utils";

function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "min-h-11 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-slate-900 outline-none ring-slate-300 transition focus-visible:ring-2",
        className
      )}
      {...props}
    />
  );
}

export { Select };
