import { APP_PAGE_REGISTRY, type AppPageDefinition } from "@/config/page-registry";

export type SidebarCategory = "Core" | "Coding" | "Career" | "Community";
export type SidebarMenuItem = AppPageDefinition & { category: SidebarCategory };
export interface SidebarMenuGroup {
  category: SidebarCategory;
  items: SidebarMenuItem[];
}

const SIDEBAR_CATEGORY_ORDER: SidebarCategory[] = ["Core", "Coding", "Career", "Community"];

export const SIDEBAR_MENU_ITEMS = APP_PAGE_REGISTRY
  .filter(
    (item): item is SidebarMenuItem =>
      item.inSidebar && (item.category === "Core" || item.category === "Coding" || item.category === "Career" || item.category === "Community"),
  )
  .sort((a, b) => {
    const categoryRank = SIDEBAR_CATEGORY_ORDER.indexOf(a.category) - SIDEBAR_CATEGORY_ORDER.indexOf(b.category);
    if (categoryRank !== 0) return categoryRank;
    return a.label.localeCompare(b.label);
  });

export const SIDEBAR_MENU_GROUPS: SidebarMenuGroup[] = SIDEBAR_CATEGORY_ORDER
  .map((category) => ({
    category,
    items: SIDEBAR_MENU_ITEMS.filter((item) => item.category === category),
  }))
  .filter((group) => group.items.length > 0);

export const SIDEBAR_ITEM_BY_ID = new Map(SIDEBAR_MENU_ITEMS.map((item) => [item.id, item]));
