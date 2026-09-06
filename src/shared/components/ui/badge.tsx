import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-[var(--primary-hover)] shadow-xs",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-destructive/30 bg-destructive/15 text-destructive dark:bg-destructive/25 dark:text-red-300 [a&]:hover:bg-destructive/25",
        outline:
          "border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        success:
          "border-emerald-200/60 bg-emerald-50 text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/50 dark:text-emerald-300 [a&]:hover:bg-emerald-100 dark:[a&]:hover:bg-emerald-900/60",
        warning:
          "border-amber-200/60 bg-amber-50 text-amber-700 dark:border-amber-800/50 dark:bg-amber-950/50 dark:text-amber-300 [a&]:hover:bg-amber-100 dark:[a&]:hover:bg-amber-900/60",
        info:
          "border-blue-200/60 bg-blue-50 text-blue-700 dark:border-blue-800/50 dark:bg-blue-950/50 dark:text-blue-300 [a&]:hover:bg-blue-100 dark:[a&]:hover:bg-blue-900/60",
        subtle:
          "border-border/50 bg-muted/70 text-muted-foreground [a&]:hover:bg-muted",
        neutral:
          "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
