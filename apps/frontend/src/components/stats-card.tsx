import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number;
  description?: string;
  className?: string;
  icon: LucideIcon;
  color?: "default" | "green" | "blue" | "red" | "yellow";
}

const colorMap = {
  default: "bg-slate-50 border-slate-200",
  green: "bg-green-50 border-green-200",
  blue: "bg-blue-50 border-blue-200",
  red: "bg-red-50 border-red-200",
  yellow: "bg-yellow-50 border-yellow-200",
};

const valueColorMap = {
  default: "text-slate-900",
  green: "text-green-700",
  blue: "text-blue-700",
  red: "text-red-700",
  yellow: "text-yellow-700",
};

const titleColorMap = {
  default: "text-slate-500",
  green: "text-green-600",
  blue: "text-blue-600",
  red: "text-red-600",
  yellow: "text-yellow-600",
};

const iconColorMap = {
  default: "text-slate-400",
  green: "text-green-500",
  blue: "text-blue-500",
  red: "text-red-500",
  yellow: "text-yellow-500",
};

export function StatsCard({ title, value, description, className, icon: Icon, color = "default" }: StatsCardProps) {
  return (
    <Card className={cn("border-2 transition-all hover:shadow-md", colorMap[color], className)}>
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex items-center justify-between mb-2">
          <p className={cn("text-xs font-semibold uppercase tracking-wide", titleColorMap[color])}>{title}</p>
          <Icon className={cn("w-4 h-4", iconColorMap[color])} />
        </div>
        <p className={cn("text-2xl font-black", valueColorMap[color])}>{value}</p>
        {description && <p className="text-xs text-slate-400 mt-1">{description}</p>}
      </CardContent>
    </Card>
  );
}
