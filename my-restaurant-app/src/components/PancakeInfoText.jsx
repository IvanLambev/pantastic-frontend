import { Info } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * PancakeInfoText - Displays allergen and pricing information for pancakes
 * Mobile responsive and retina ready component
 */
export function PancakeInfoText({ className, iconClassName, textClassName }) {
  return (
    <div 
      className={cn(
        "flex items-start gap-2 text-left text-xs sm:text-sm text-muted-foreground leading-relaxed",
        className
      )}
    >
      <Info 
        className={cn(
          "h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 mt-0.5 text-blue-500",
          iconClassName
        )} 
        strokeWidth={2}
      />
      <p className={cn("flex-1", textClassName)}>
        Всички палачинки съдържат мляко, яйца, брашно и глутен.
        <br />
        В цената на всяка палачинка е включена кутия за храна (0,20 € / 0.40 лв)
      </p>
    </div>
  )
}
