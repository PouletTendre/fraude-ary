import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function IndicatorCard({
  title,
  children,
  badge,
}: {
  title: string;
  children: React.ReactNode;
  badge?: { label: string; variant: "success" | "neutral" | "subtle" };
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          {badge && <Badge variant={badge.variant}>{badge.label}</Badge>}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
