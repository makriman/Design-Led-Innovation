import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-12 items-center justify-center rounded-lg px-5 py-3 font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        default: "bg-primary text-white hover:bg-primary/90",
        accent: "bg-accent text-white hover:bg-accent/90",
        outline: "border border-primary/40 bg-white text-primary hover:bg-primary/5",
        ghost: "bg-transparent text-primary hover:bg-primary/10",
      },
      size: {
        default: "text-lg",
        sm: "min-h-10 px-4 py-2 text-base",
        lg: "min-h-14 px-6 py-4 text-xl",
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
