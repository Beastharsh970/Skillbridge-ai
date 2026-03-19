import { cn } from "@/lib/cn";

interface SkillBadgeProps {
  name: string;
  variant?: "default" | "success" | "warning" | "danger" | "primary";
  size?: "sm" | "md";
}

const variantStyles = {
  default: "bg-secondary text-secondary-foreground",
  success: "bg-green-500/10 text-green-600 dark:text-green-400",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  danger: "bg-red-500/10 text-red-600 dark:text-red-400",
  primary: "bg-primary/10 text-primary",
};

export default function SkillBadge({ name, variant = "default", size = "md" }: SkillBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        variantStyles[variant],
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
      )}
    >
      {name}
    </span>
  );
}
