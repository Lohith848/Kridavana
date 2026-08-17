import * as React from "react"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface SearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void
  isLoading?: boolean
}

const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(
  ({ className, onClear, isLoading, value, ...props }, ref) => {
    const hasValue = value && String(value).length > 0

    return (
      <div className={cn("relative group", className)}>
        <Search
          className={cn(
            "absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors duration-200",
            hasValue ? "text-amber" : "text-muted"
          )}
        />
        <input
          ref={ref}
          value={value}
          className={cn(
            "w-full h-11 pl-10 pr-10 rounded-lg border border-hairline bg-surfaceRaised",
            "text-sm text-cream placeholder:text-muted/70",
            "transition-all duration-200 ease-out",
            "focus:outline-none focus:border-amber focus:shadow-[0_0_0_3px_rgba(232,163,61,0.12)]",
            "hover:border-hairline/80"
          )}
          {...props}
        />
        <AnimatePresence>
          {(hasValue || isLoading) && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              type="button"
              onClick={onClear}
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center",
                "rounded-full bg-surfaceRaised text-muted hover:text-cream hover:bg-surface",
                "transition-colors duration-150"
              )}
            >
              {isLoading ? (
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-amber border-t-transparent" />
              ) : (
                <X className="h-3.5 w-3.5" />
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    )
  }
)
SearchBar.displayName = "SearchBar"

export { SearchBar }
