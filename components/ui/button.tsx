import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ring-offset-white",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-white shadow-soft hover:bg-primary-700 hover:shadow-soft-lg active:scale-[0.98]",
        outline:
          "border-2 border-slate-200 bg-white text-slate-800 hover:border-primary/40 hover:bg-primary/5 hover:text-primary",
        ghost: "bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900",
        subtle: "bg-slate-100 text-slate-800 hover:bg-slate-200",
        secondary:
          "bg-secondary text-white shadow-soft hover:bg-secondary-600 active:scale-[0.98]",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-lg px-4",
        lg: "h-12 rounded-xl px-6 text-base",
        icon: "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function ButtonComponent(
    { className, variant, size, asChild, ...props },
    ref
  ) {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
