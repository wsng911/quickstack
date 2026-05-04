import { cn } from "@/frontend/utils/utils";

type ProgressColor = "green" | "orange" | "gray" | "default";

interface MultiStateProgressProps {
  segments: {
    value: number;
    color: ProgressColor;
  }[];
  class名称?: string;
}

export function MultiStateProgress({ segments, class名称 }: MultiStateProgressProps) {
    const colorClasses: Record<ProgressColor, string> = {
        green: "bg-teal-600",
        orange: "bg-orange-500",
        gray: "bg-gray-200",
        default: "bg-primary",
    }

  return (
    <div
      class名称={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-secondary flex",
        class名称
      )}
    >
      {segments.map((segment, index) => (
        <div
          key={index}
          class名称={cn("h-full transition-all", colorClasses[segment.color])}
          style={{ width: `${segment.value}%` }}
        />
      ))}
    </div>
  );
}
