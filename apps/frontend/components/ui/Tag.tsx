import { cn } from "@/lib/utils";

interface TagProps {
  children: React.ReactNode;
  className?: string;
}

export function Tag({ children, className }: TagProps) {
  return (
    <span
      className={cn("inline-block whitespace-nowrap", className)}
      style={{
        background: "var(--surface-raised)",
        border: "1px solid var(--border)",
        borderRadius: "6px",
        padding: "3px 8px",
        fontSize: "11px",
        color: "var(--text-secondary)",
      }}
    >
      {children}
    </span>
  );
}
