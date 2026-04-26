"use client";
import { ExternalLink } from "lucide-react";
import { useNews } from "@/hooks/useNews";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

interface NewsCardProps {
  symbol: string;
  limit?: number;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d`;
}

export function NewsCard({ symbol, limit = 10 }: NewsCardProps) {
  const { data, isLoading, error } = useNews(symbol, limit);
  const items = data?.items ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>News for {symbol}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-text-tertiary py-4 text-center">
            Failed to load news
          </p>
        ) : items.length === 0 ? (
          <p className="text-sm text-text-tertiary py-4 text-center">
            No recent news
          </p>
        ) : (
          <ul className="divide-y divide-border -mx-2">
            {items.map((item, index) => (
              <li key={index}>
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 px-2 py-3 hover:bg-surface-sunken rounded transition-colors group"
                >
                  <ExternalLink className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-text-muted group-hover:text-primary transition-colors" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary group-hover:text-primary-hover transition-colors line-clamp-2">
                      {item.title}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5 flex items-center gap-2">
                      {item.source && <span>{item.source}</span>}
                      {item.published && (
                        <span>{timeAgo(item.published)}</span>
                      )}
                    </p>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
