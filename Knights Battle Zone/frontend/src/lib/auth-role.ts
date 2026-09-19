export const normalizeRole = (role?: string | null) => {
  if (!role) return "";
  return role.replace(/^ROLE_/i, "").toUpperCase();
};

export const isSuperAdminRole = (role?: string | null) => normalizeRole(role) === "SUPER_ADMIN";

export const isAdminRole = (role?: string | null) => {
  const normalized = normalizeRole(role);
  return normalized === "ADMIN" || normalized === "SUPER_ADMIN";
};
