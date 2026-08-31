import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  className?: string;
}) {
  return (
    <Card size="sm" className={cn("shadow-sm", className)}>
      <CardHeader className="pb-1">
        <CardDescription className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {label}
        </CardDescription>
        <CardTitle className="tabular text-2xl font-semibold text-foreground">{value}</CardTitle>
      </CardHeader>
      {hint ? <CardContent className="text-xs text-muted-foreground">{hint}</CardContent> : null}
    </Card>
  );
}
