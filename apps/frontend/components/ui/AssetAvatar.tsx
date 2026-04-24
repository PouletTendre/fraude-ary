import { cn } from "@/lib/utils";

interface AssetAvatarProps {
  symbol: string;
  type?: "equity" | "crypto" | "other";
  className?: string;
}

export function AssetAvatar({ symbol, type = "other", className }: AssetAvatarProps) {
  const initials = symbol.slice(0, 2).toUpperCase();

  const styles = {
    equity: {
      bg: "rgba(99,102,241,0.18)",
      border: "rgba(99,102,241,0.3)",
      text: "#818CF8",
    },
    crypto: {
      bg: "rgba(34,211,238,0.15)",
      border: "rgba(34,211,238,0.3)",
      text: "#22D3EE",
    },
    other: {
      bg: "rgba(16,185,129,0.15)",
      border: "rgba(16,185,129,0.3)",
      text: "#10B981",
    },
  };

  const s = styles[type];

  return (
    <div
      className={cn(
        "flex items-center justify-center flex-shrink-0",
        className
      )}
      style={{
        width: "34px",
        height: "34px",
        borderRadius: "9999px",
        fontSize: "11px",
        fontWeight: 600,
        background: s.bg,
        border: `1px solid ${s.border}`,
        color: s.text,
      }}
    >
      {initials}
    </div>
  );
}
