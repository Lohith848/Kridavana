import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center gap-1 rounded-pill border px-2.5 py-0.5 text-xs font-medium transition-all duration-150 whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "border-amber/30 bg-amber/10 text-amber",
        secondary:
          "border-hairline bg-surfaceRaised text-cream",
        outline:
          "border-hairline bg-transparent text-muted",
        subtle: "bg-surfaceRaised text-muted border border-transparent",
        destructive:
          "border-rose/30 bg-rose/10 text-rose",
        playing: "border-teal/30 bg-teal/10 text-teal",
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
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
