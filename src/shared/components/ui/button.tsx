import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-150 ease-out select-none disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 active:scale-[0.98] motion-reduce:transform-none motion-reduce:transition-none cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-[var(--primary-hover)] hover:shadow-sm",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 hover:shadow-sm focus-visible:ring-destructive/30",
        success:
          "bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 hover:shadow-sm focus-visible:ring-emerald-500/30",
        outline:
          "border border-border/80 bg-background/80 shadow-2xs hover:border-primary/40 hover:bg-accent/60 hover:text-accent-foreground dark:bg-card/60 dark:hover:bg-accent/40",
        secondary:
          "bg-secondary text-secondary-foreground shadow-2xs hover:bg-secondary/80",
        subtle:
          "bg-primary/[0.08] text-primary hover:bg-primary/[0.15] dark:bg-primary/20 dark:text-primary-foreground dark:hover:bg-primary/30",
        ghost:
          "text-muted-foreground hover:bg-muted/80 hover:text-foreground dark:hover:bg-muted/60",
        link: "text-primary underline-offset-4 hover:underline p-0 h-auto active:scale-100",
      },
      size: {
        xs: "h-7 px-2.5 text-xs rounded-lg gap-1",
        sm: "h-8.5 px-3 text-xs rounded-lg gap-1.5",
        default: "h-10 px-4 py-2 text-sm rounded-xl",
        lg: "h-11 px-6 text-sm rounded-xl min-h-[44px]",
        icon: "size-10 rounded-xl",
        "icon-sm": "size-8.5 rounded-lg",
        "icon-lg": "size-11 rounded-xl min-w-[44px] min-h-[44px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="size-4 animate-spin shrink-0" />
          <span>{children}</span>
        </>
      ) : (
        children
      )}
    </Comp>
  )
}

export { Button, buttonVariants }
export type { ButtonProps }
