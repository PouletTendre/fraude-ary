import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn("animate-skeleton bg-skeleton", className)}
      style={{ borderRadius: "var(--r-sm)", ...style }}
    />
  );
}
