import { SIDEBAR_MENU_ITEMS } from "@/config/sidebar-menu";

const ROUTE_TO_SIDEBAR_ID: Array<{ prefix: string; id: string }> = [
  ...SIDEBAR_MENU_ITEMS.map((item) => ({ prefix: item.href, id: item.id })),
  { prefix: "/my-profile", id: "profile" },
  { prefix: "/help", id: "dashboard" },
];

ROUTE_TO_SIDEBAR_ID.sort((a, b) => b.prefix.length - a.prefix.length);

export const resolveSidebarItemId = (path: string): string => {
  const normalized = path === "/" ? "/dashboard" : path;
  const matchedRoute = ROUTE_TO_SIDEBAR_ID.find((item) => normalized.startsWith(item.prefix));
  return matchedRoute?.id ?? "dashboard";
};
