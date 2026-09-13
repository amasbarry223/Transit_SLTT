import * as React from "react"

import { cn } from "@/shared/utils/cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full min-w-0 rounded-xl border border-input bg-background/85 px-3.5 py-2 text-sm text-foreground shadow-2xs transition-all duration-150 ease-out outline-none",
        "placeholder:text-muted-foreground/80 selection:bg-primary selection:text-primary-foreground",
        "hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/20",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/30",
        "dark:bg-card/60 dark:border-border/80 dark:hover:border-primary/50 dark:focus:border-primary",
        "file:border-0 file:bg-transparent file:text-sm file:font-semibold file:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Input }

