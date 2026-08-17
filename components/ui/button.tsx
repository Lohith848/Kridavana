import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-btn text-sm font-medium transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber focus-visible:ring-offset-2 focus-visible:ring-offset-ink disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-amber text-ink hover:bg-amber/90 shadow-glow",
        primary: "bg-amber text-ink hover:bg-amber/90 shadow-glow",
        secondary:
          "bg-surfaceRaised text-cream border border-hairline hover:border-amber/40 hover:text-amber",
        outline:
          "border border-hairline bg-transparent text-cream hover:bg-surfaceRaised hover:border-amber/40",
        ghost:
          "text-muted hover:text-cream hover:bg-surfaceRaised",
        destructive:
          "bg-rose/10 text-rose border border-rose/20 hover:bg-rose/20",
        link: "text-amber underline-offset-4 hover:underline",
        subtle: "text-muted hover:text-cream hover:bg-surfaceRaised",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        xs: "h-6 px-2 text-[11px]",
        lg: "h-11 px-6 text-base",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
