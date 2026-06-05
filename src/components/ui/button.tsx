import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-[13px] font-[510] tracking-[-0.01em] ring-offset-background transition-all duration-smooth ease-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "rounded-full bg-primary text-primary-foreground hover:opacity-90",
        destructive: "rounded-full bg-destructive text-destructive-foreground hover:opacity-90",
        outline: "rounded-full border border-border bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground",
        secondary: "rounded-full bg-secondary text-secondary-foreground hover:bg-accent",
        ghost: "rounded-full hover:bg-secondary hover:text-secondary-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        /* Primary CTA: fully-rounded pill, #E5E5E6 background, #08090A text */
        atlas: "rounded-full bg-primary text-primary-foreground hover:opacity-90",
        accent: "rounded-full bg-primary text-primary-foreground hover:opacity-90",
        "atlas-outline": "rounded-full border border-foreground/20 text-foreground bg-transparent hover:bg-foreground/5",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 px-4",
        lg: "h-11 px-7",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
