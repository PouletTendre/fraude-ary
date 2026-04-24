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
      bg: "bg-avatar-equity-bg",
      border: "border-avatar-equity-border",
      text: "text-avatar-equity-text",
    },
    crypto: {
      bg: "bg-avatar-crypto-bg",
      border: "border-avatar-crypto-border",
      text: "text-avatar-crypto-text",
    },
    other: {
      bg: "bg-avatar-other-bg",
      border: "border-avatar-other-border",
      text: "text-avatar-other-text",
    },
  };

  const s = styles[type];

  return (
    <div
      className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center border text-[11px] font-semibold",
        s.bg,
        s.border,
        s.text,
        className
      )}
    >
      {initials}
    </div>
  );
}
