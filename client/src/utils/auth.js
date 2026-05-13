export function getStoredToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token') || '';
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
}

function getActiveAuthStorage() {
  if (localStorage.getItem('token')) return localStorage;
  if (sessionStorage.getItem('token')) return sessionStorage;
  return localStorage;
}

export function saveAuthSession({ token, user }, remember = null) {
  const storage = remember === null
    ? getActiveAuthStorage()
    : remember
      ? localStorage
      : sessionStorage;
  const otherStorage = storage === localStorage ? sessionStorage : localStorage;

  storage.setItem('token', token);
  storage.setItem('user', JSON.stringify(user));
  otherStorage.removeItem('token');
  otherStorage.removeItem('user');
}

export function clearAuthSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
}

export function getAuthHeaders(extraHeaders = {}) {
  const token = getStoredToken();
  return token
    ? { ...extraHeaders, Authorization: `Bearer ${token}` }
    : extraHeaders;
}

export function hasRoleAccess(role, allowedRoles = []) {
  if (!allowedRoles.length) return true;
  if (allowedRoles.includes(role)) return true;
  if (role === 'seller' && allowedRoles.includes('buyer')) return true;
  return false;
}

export function getRoleLabel(role) {
  switch (role) {
    case 'seller':
      return 'Vendedor';
    case 'admin':
      return 'Administrador';
    case 'buyer':
    default:
      return 'Comprador';
  }
}
