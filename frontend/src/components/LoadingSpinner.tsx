import { cn } from "@/lib/cn";

export default function LoadingSpinner({
  className,
  text,
}: {
  className?: string;
  text?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div
        className={cn(
          "h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary",
          className
        )}
      />
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
      )}
    </div>
  );
}
