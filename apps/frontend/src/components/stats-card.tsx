import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: number;
  description?: string;
  className?: string;
  icon?: string;
  color?: "default" | "green" | "blue" | "red" | "yellow";
}

const colorMap = {
  default: "bg-slate-50 border-slate-200 text-slate-700",
  green: "bg-green-50 border-green-200 text-green-700",
  blue: "bg-blue-50 border-blue-200 text-blue-700",
  red: "bg-red-50 border-red-200 text-red-700",
  yellow: "bg-yellow-50 border-yellow-200 text-yellow-700",
};

const valuColorMap = {
  default: "text-slate-900",
  green: "text-green-700",
  blue: "text-blue-700",
  red: "text-red-700",
  yellow: "text-yellow-700",
};

export function StatsCard({ title, value, description, className, icon, color = "default" }: StatsCardProps) {
  return (
    <Card className={cn("border-2 transition-all hover:shadow-md", colorMap[color], className)}>
      <CardContent className="pt-6 pb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold uppercase tracking-wide opacity-70">{title}</p>
          {icon && <span className="text-2xl">{icon}</span>}
        </div>
        <p className={cn("text-4xl font-black mt-1", valuColorMap[color])}>{value}</p>
        {description && <p className="text-xs opacity-60 mt-2">{description}</p>}
      </CardContent>
    </Card>
  );
}
