"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer relative flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-hairline transition-all duration-150 outline-none",
        "hover:border-amber/60",
        "focus:border-amber focus:ring-2 focus:ring-amber/20",
        "data-[state=checked]:border-amber data-[state=checked]:bg-amber data-[state=checked]:text-ink",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-rose aria-invalid:ring-2 aria-invalid:ring-rose/20",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current transition-none"
      >
        <Check className="h-3 w-3" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
