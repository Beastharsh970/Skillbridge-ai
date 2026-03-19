import { cn } from "@/lib/cn";

interface ScoreIndicatorProps {
  score: number;
  size?: "sm" | "md" | "lg";
  label?: string;
}

export default function ScoreIndicator({ score, size = "md", label }: ScoreIndicatorProps) {
  const dims = { sm: 80, md: 120, lg: 160 };
  const strokes = { sm: 6, md: 8, lg: 10 };
  const fonts = { sm: "text-lg", md: "text-2xl", lg: "text-4xl" };
  const d = dims[size];
  const stroke = strokes[size];
  const radius = (d - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 75 ? "text-green-500" : score >= 50 ? "text-amber-500" : "text-red-500";
  const strokeColor =
    score >= 75 ? "stroke-green-500" : score >= 50 ? "stroke-amber-500" : "stroke-red-500";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: d, height: d }}>
        <svg width={d} height={d} className="-rotate-90">
          <circle
            cx={d / 2}
            cy={d / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            className="stroke-muted"
          />
          <circle
            cx={d / 2}
            cy={d / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={cn(strokeColor, "transition-all duration-1000 ease-out")}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-bold", fonts[size], color)}>{score}</span>
        </div>
      </div>
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
    </div>
  );
}
