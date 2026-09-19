// Layout & Navigation
export { default as Sidebar } from "./Sidebar";
export { AppLayout } from "./AppLayout";
export { SimpleAppLayout } from "./SimpleAppLayout";
export { AppErrorBoundary } from "./AppErrorBoundary";
export { AppFooter } from "./AppFooter";
export { ProtectedRoute } from "./ProtectedRoute";

// Feature Components
export { BrandIdentity } from "./BrandIdentity";
export { BrandLogo } from "./BrandLogo";
export { FloatingChatWidget } from "./FloatingChatWidget";
export { NotificationCenter } from "./NotificationCenter";
export { ThemeSwitcher } from "./ThemeSwitcher";
export { RouteMotionContainer } from "./RouteEnhancements";
export { SeoJsonLd } from "./SeoJsonLd";
export { ImagePlaceholder } from "./ImagePlaceholder";
export { UserAvatar, LeaderboardBadge, AchievementBadge, GameModeCard } from "./AvatarAndBadges";
export { NavLink } from "./NavLink";

// Sub-feature exports
export * from "./clubs";
export * from "./duels";
export * from "./placement";
export * from "./livechat";
export * from "./marketplace";
export * from "./mock-interview";

// UI Components (shadcn/ui)
export * from "./ui";
