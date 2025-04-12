import { cn } from "@/lib/utils"

interface TimelineProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function Timeline({ children, className, ...props }: TimelineProps) {
  return (
    <div className={cn("space-y-8", className)} {...props}>
      {children}
    </div>
  )
}

interface TimelineItemProps extends React.HTMLAttributes<HTMLDivElement> {
  year: string
  title: string
  children: React.ReactNode
}

export function TimelineItem({ year, title, children, className, ...props }: TimelineItemProps) {
  return (
    <div className={cn("relative pl-8 before:absolute before:left-0 before:top-2 before:h-full before:w-[2px] before:bg-primary/20 last:before:hidden", className)} {...props}>
      <div className="absolute left-0 top-2 -translate-x-[5px] h-3 w-3 rounded-full bg-primary" />
      <div className="text-sm text-primary font-semibold mb-2">{year}</div>
      <h3 className="font-bold mb-2">{title}</h3>
      <div className="text-muted-foreground">{children}</div>
    </div>
  )
}