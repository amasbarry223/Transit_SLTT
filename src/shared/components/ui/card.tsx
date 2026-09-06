import * as React from "react"

import { cn } from "@/lib/utils"

interface CardProps extends React.ComponentProps<"div"> {
  variant?: "default" | "elevated" | "interactive" | "sunken" | "outline"
}

function Card({ className, variant = "default", ...props }: CardProps) {
  const variantClasses = {
    default: "bg-card text-card-foreground border border-border/80 shadow-2xs",
    elevated: "bg-card text-card-foreground border border-border/60 shadow-md",
    interactive:
      "bg-card text-card-foreground border border-border/80 shadow-2xs transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md active:scale-[0.99] cursor-pointer",
    sunken: "bg-muted/50 text-foreground border border-border/50",
    outline: "bg-transparent border-2 border-border/80 text-card-foreground",
  }[variant]

  return (
    <div
      data-slot="card"
      className={cn(
        "flex flex-col gap-6 rounded-2xl py-6 transition-colors",
        variantClasses,
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
