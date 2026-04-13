import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(({ className, ...props }, ref) => {
  return (
    <input
      className={cn(
        "min-h-12 w-full rounded-lg border border-border bg-white px-4 py-3 text-lg text-slate-900 outline-none ring-primary transition placeholder:text-slate-400 focus-visible:ring-2",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
