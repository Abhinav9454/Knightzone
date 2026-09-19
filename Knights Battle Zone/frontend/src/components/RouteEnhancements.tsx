import type { ReactNode } from "react";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

type RouteMotionContainerProps = {
  children: ReactNode;
  className?: string;
};

const PROBLEM_ROUTE_PATTERN = /^\/(?:simple\/)?problems\/\d+/;

const joinClasses = (...values: Array<string | undefined | false>) => values.filter(Boolean).join(" ");

export function ScrollToTopOnRoute() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (PROBLEM_ROUTE_PATTERN.test(location.pathname)) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, [location.pathname]);

  return null;
}

export function RouteMotionContainer({ children, className }: RouteMotionContainerProps) {
  const location = useLocation();

  return (
    <div key={location.pathname} className={joinClasses("route-motion", className)}>
      {children}
    </div>
  );
}

