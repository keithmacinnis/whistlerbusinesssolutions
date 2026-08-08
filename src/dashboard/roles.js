/** Normalize API user.roles (with legacy user.role fallback). */
export function userRoles(user) {
  if (!user) return []
  if (Array.isArray(user.roles) && user.roles.length) return user.roles
  if (user.role) return [user.role]
  return []
}

export function hasRole(user, ...wanted) {
  const roles = userRoles(user)
  return wanted.some((r) => roles.includes(r))
}

export function formatRoles(user) {
  return userRoles(user)
    .map((r) => r.replace(/_/g, ' '))
    .join(', ')
}
