import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const cycle = () => {
    const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    setTheme(next);
  };

  return (
    <button
      onClick={cycle}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 hover:bg-primary/10"
      aria-label="Toggle theme"
    >
      {theme === "light" && <Sun className="h-[1.1rem] w-[1.1rem] text-amber-500" />}
      {theme === "dark" && <Moon className="h-[1.1rem] w-[1.1rem] text-indigo-400" />}
      {theme === "system" && <Monitor className="h-[1.1rem] w-[1.1rem] text-muted-foreground" />}
    </button>
  );
}
