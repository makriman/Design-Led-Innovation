import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center rounded-full px-5 py-2.5 font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        default: "bg-primary text-white hover:bg-primary/90 focus-visible:ring-primary/40",
        accent: "bg-accent text-white hover:bg-accent/90 focus-visible:ring-rose-300",
        outline: "border border-primary/30 bg-white text-primary hover:border-primary/45 hover:bg-primary/5 focus-visible:ring-primary/20",
        ghost: "bg-transparent text-primary hover:bg-primary/10 focus-visible:ring-primary/20",
      },
      size: {
        default: "text-sm",
        sm: "min-h-9 px-4 py-2 text-sm",
        lg: "min-h-12 px-6 py-3 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => {
    return <button type={type} className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
