export const ROLE = Object.freeze({
  CUSTOMER: 0,
  ADMIN: 1,
  MANAGER: 2,
  SUPERADMIN: 3,
});

export const ROLE_LABELS = Object.freeze({
  [ROLE.CUSTOMER]: "customer",
  [ROLE.ADMIN]: "admin",
  [ROLE.MANAGER]: "manager",
  [ROLE.SUPERADMIN]: "superadmin",
});

export const ADMIN_ROLES = [ROLE.ADMIN, ROLE.MANAGER, ROLE.SUPERADMIN];

export const normalizeRoleInput = (roleInput, fallback = ROLE.CUSTOMER) => {
  if (typeof roleInput === "number") {
    if (Object.values(ROLE).includes(roleInput)) return roleInput;
    return fallback;
  }

  if (typeof roleInput === "string") {
    const normalized = roleInput.trim().toLowerCase();

    if (normalized === "0" || normalized === "customer") return ROLE.CUSTOMER;
    if (normalized === "1" || normalized === "admin") return ROLE.ADMIN;
    if (normalized === "2" || normalized === "manager") return ROLE.MANAGER;
    if (normalized === "3" || normalized === "superadmin")
      return ROLE.SUPERADMIN;
  }

  return fallback;
};

export const hasAdminAccess = (role) => ADMIN_ROLES.includes(role);

export const hasSuperAdminAccess = (role) => role === ROLE.SUPERADMIN;
