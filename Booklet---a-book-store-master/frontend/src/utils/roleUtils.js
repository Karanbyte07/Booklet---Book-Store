export const ROLE = Object.freeze({
  CUSTOMER: 0,
  ADMIN: 1,
  MANAGER: 2,
  SUPERADMIN: 3,
});

export const ROLE_OPTIONS = [
  { value: ROLE.SUPERADMIN, label: "Superadmin" },
  { value: ROLE.ADMIN, label: "Admin" },
  { value: ROLE.MANAGER, label: "Manager" },
  { value: ROLE.CUSTOMER, label: "Customer" },
];

export const normalizeRole = (roleInput) => {
  const roleNumber = Number(roleInput);
  if (Number.isNaN(roleNumber)) return ROLE.CUSTOMER;
  if (Object.values(ROLE).includes(roleNumber)) return roleNumber;
  return ROLE.CUSTOMER;
};

export const getRoleLabel = (roleInput) => {
  const role = normalizeRole(roleInput);
  if (role === ROLE.SUPERADMIN) return "Superadmin";
  if (role === ROLE.ADMIN) return "Admin";
  if (role === ROLE.MANAGER) return "Manager";
  return "Customer";
};

export const hasAdminAccess = (roleInput) => {
  const role = normalizeRole(roleInput);
  return [ROLE.ADMIN, ROLE.MANAGER, ROLE.SUPERADMIN].includes(role);
};

export const hasSuperAdminAccess = (roleInput) =>
  normalizeRole(roleInput) === ROLE.SUPERADMIN;
