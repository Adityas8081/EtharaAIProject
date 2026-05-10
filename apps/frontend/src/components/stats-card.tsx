import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: number;
  description?: string;
  className?: string;
}

export function StatsCard({ title, value, description, className }: StatsCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardContent className="pt-6">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-3xl font-bold mt-1">{value}</p>
        {description && <p className="text-xs text-slate-400 mt-1">{description}</p>}
      </CardContent>
    </Card>
  );
}
