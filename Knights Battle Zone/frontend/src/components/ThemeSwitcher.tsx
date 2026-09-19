import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme, type AppTheme } from "@/contexts/ThemeContext";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-9 w-9 rounded-full border border-transparent transition-all duration-300 hover:scale-105 hover:border-primary/35 hover:bg-accent/20 hover:shadow-[0_0_16px_hsl(var(--primary)/0.35)]"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? (
        <Moon className="h-4 w-4 transition-all duration-300 hover:rotate-12" />
      ) : (
        <Sun className="h-4 w-4 transition-all duration-300 hover:rotate-90" />
      )}
    </Button>
  );
}
