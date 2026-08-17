import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full rounded-lg border border-hairline bg-surfaceRaised px-3 py-2 text-sm text-cream transition-all duration-150 outline-none",
        "placeholder:text-muted",
        "focus:border-amber focus:shadow-[0_0_0_3px_rgba(232,163,61,0.15)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "file:inline-flex file:h-10 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-cream",
        className
      )}
      {...props}
    />
  )
}

export { Input }
