import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(({ className, ...props }, ref) => {
  return (
    <input
      className={cn(
        "min-h-11 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-slate-900 outline-none ring-slate-300 transition placeholder:text-slate-400 focus-visible:ring-2",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
