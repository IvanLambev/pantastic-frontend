import React from "react";
import { cn } from "@/lib/utils";

type Status = "complete" | "incomplete" | "cancelled";

interface TimelineProps {
  className?: string;
  children: React.ReactNode;
}

interface TimelineItemProps {
  className?: string;
  children: React.ReactNode;
}

interface TimelineDotProps {
  status: Status;
  className?: string;
}

interface TimelineConnectorProps {
  status: Status;
  className?: string;
}

interface TimelineContentProps {
  className?: string;
  children: React.ReactNode;
}

export function Timeline({ className, children }: TimelineProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {children}
    </div>
  );
}

export function TimelineItem({ className, children }: TimelineItemProps) {
  return (
    <div className={cn("flex items-start gap-2", className)}>
      {children}
    </div>
  );
}

export function TimelineDot({ status, className }: TimelineDotProps) {
  return (
    <div className={cn(
      "relative flex h-3 w-3 shrink-0 items-center justify-center",
      className
    )}>
      <div className={cn(
        "h-3 w-3 rounded-full",
        status === "complete" && "bg-primary",
        status === "incomplete" && "border-2 border-muted-foreground",
        status === "cancelled" && "bg-destructive"
      )} />
    </div>
  );
}

export function TimelineConnector({ status, className }: TimelineConnectorProps) {
  return (
    <div className={cn(
      "relative left-1.5 h-10 w-px -translate-x-1/2",
      status === "complete" && "bg-primary",
      status === "incomplete" && "bg-muted-foreground/30",
      status === "cancelled" && "bg-destructive/30",
      className
    )} />
  );
}

export function TimelineContent({ className, children }: TimelineContentProps) {
  return (
    <div className={cn("ml-2 pb-8", className)}>
      {children}
    </div>
  );
}