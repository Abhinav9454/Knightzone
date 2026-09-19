import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, Search } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6" style={{ background: "var(--gradient-hero)" }}>
      <div className="w-full max-w-2xl glass-card p-6 sm:p-8 md:p-12 text-center">
        <div className="hero-chip mx-auto mb-6 w-fit">
          <Search size={14} />
          Route Not Found
        </div>
        <h1 className="text-6xl sm:text-7xl md:text-8xl font-black gradient-text mb-4">404</h1>
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">Page not found</h2>
        <p className="text-base sm:text-lg text-muted-foreground mt-4 mb-8 leading-relaxed">
          The route <span className="font-mono text-foreground text-sm sm:text-base bg-background/60 px-2 py-1 rounded">{location.pathname}</span> doesn't exist.
          <br />
          Let's get you back to the platform.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <a href="/">
            <Button className="gap-2 h-11 px-6 text-base font-semibold w-full sm:w-auto">
              <Home size={18} />
              Go to Dashboard
            </Button>
          </a>
          <a href="/">
            <Button variant="outline" className="gap-2 h-11 px-6 text-base font-semibold w-full sm:w-auto">
              Go to Home
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
