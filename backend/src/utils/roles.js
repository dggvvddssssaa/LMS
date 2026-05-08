const normalizeRole = (role) => {
  if (role === 'teacher') return 'instructor';
  return role;
};

const hasRole = (userRole, ...allowedRoles) => {
  const normalizedUserRole = normalizeRole(userRole);
  const normalizedAllowedRoles = allowedRoles.map(normalizeRole);
  return normalizedAllowedRoles.includes(normalizedUserRole);
};

module.exports = {
  normalizeRole,
  hasRole,
};
