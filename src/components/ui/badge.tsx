import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-zinc-900 text-zinc-50 shadow hover:bg-zinc-800",
        secondary:
          "border-transparent bg-zinc-100 text-zinc-900 hover:bg-zinc-200",
        destructive:
          "border-transparent bg-red-100 text-red-700 border-red-200",
        outline: "text-zinc-950 border-zinc-300",
        success:
          "border-emerald-200 bg-emerald-100 text-emerald-800",
        warning:
          "border-amber-200 bg-amber-100 text-amber-800",
        info:
          "border-sky-200 bg-sky-100 text-sky-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
