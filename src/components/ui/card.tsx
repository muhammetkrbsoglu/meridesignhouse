import * as React from "react"
import { motion } from "framer-motion"
import { useReducedMotion } from "framer-motion"
import { useDesktopAnimations } from "@/hooks/useDesktopAnimations"

import { cn } from "@/lib/utils"

function Card({ 
  className, 
  contextLevel,
  animated = true,
  ...props 
}: React.ComponentProps<"div"> & {
  animated?: boolean
  contextLevel?: "hero" | "featured" | "minimal"
}) {
  // Extract contextLevel from props to prevent it from being passed to DOM
  const { contextLevel: _, ...domProps } = props as any
  const shouldReduceMotion = useReducedMotion()
  const { createCardHoverAnimation } = useDesktopAnimations()

  // Desktop-only hover animations
  const isDesktop = typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  const hoverProps = animated && !shouldReduceMotion && isDesktop
    ? createCardHoverAnimation({ contextLevel })
    : {}

  if (!animated || shouldReduceMotion) {
    return (
      <div
        data-slot="card"
        className={cn(
          "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm focus-within:ring-2 focus-within:ring-ring/50 focus-within:ring-offset-2",
          className
        )}
        {...domProps}
      />
    )
  }

  return (
    <motion.div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm focus-within:ring-2 focus-within:ring-ring/50 focus-within:ring-offset-2",
        className
      )}
      {...hoverProps}
      {...domProps}
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
