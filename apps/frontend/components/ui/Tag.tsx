import { cn } from "@/lib/utils";

interface TagProps {
  children: React.ReactNode;
  className?: string;
}

export function Tag({ children, className }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center bg-surface-raised border border-border rounded-sm px-[8px] py-[3px] text-[11px] text-text-secondary",
        className
      )}
    >
      {children}
    </span>
  );
}
