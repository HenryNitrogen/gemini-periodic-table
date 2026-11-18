import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-zinc-950 text-white hover:bg-zinc-800 active:scale-[0.99] shadow-sm",
        outline:
          "border border-zinc-200 bg-white text-zinc-950 hover:bg-zinc-50 hover:border-zinc-300",
        secondary:
          "bg-zinc-100 text-zinc-900 hover:bg-zinc-200/80",
        ghost:
          "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950",
        inverted:
          "bg-white text-zinc-950 hover:bg-zinc-100 shadow-sm",
      },
      size: {
        default: "h-10 px-5 py-2 rounded-full",
        sm: "h-8 px-3.5 text-xs rounded-full",
        lg: "h-12 px-7 text-sm rounded-full",
        icon: "h-9 w-9 rounded-full",
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
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
