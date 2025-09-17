"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { useReducedMotion } from "framer-motion"
import { useDesktopAnimations } from "@/hooks/useDesktopAnimations"
import { cn } from "@/lib/utils"

// Animated Card component for Client Components
export function AnimatedCard({ 
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
