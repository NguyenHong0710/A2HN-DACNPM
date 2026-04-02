const AUTH_KEYS = ['token', 'user', 'isLoggedIn', 'userRole', 'rememberMe'];
const SESSION_MARKER_KEY = 'authSessionActive';

// SỬA: Ưu tiên localStorage để tránh việc F5 hoặc mở tab mới bị mất quyền Admin
const readFirst = (key) => localStorage.getItem(key) || sessionStorage.getItem(key) || null;

const normalizeRole = (value) => String(value || '').trim().toLowerCase();

const decodeJwtPayload = (token) => {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
};

const isTokenExpired = (token) => {
  const payload = decodeJwtPayload(token);
  const exp = Number(payload?.exp || 0);
  if (!exp) return false;
  const now = Math.floor(Date.now() / 1000);
  return exp <= now;
};

export const getAuthToken = () => readFirst('token');

export const getStoredUser = () => {
  const raw = readFirst('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const getStoredUserRole = () => {
  // Ưu tiên lấy trực tiếp từ userRole đã lưu
  const roleFromStorage = readFirst('userRole');
  if (roleFromStorage) return normalizeRole(roleFromStorage);

  // Nếu không có, soi vào trong object user
  const user = getStoredUser();
  if (user && user.role) return normalizeRole(user.role);

  // Cuối cùng mới soi vào JWT Token
  const payload = decodeJwtPayload(getAuthToken());
  return normalizeRole(payload?.role);
};

export const isRememberedLogin = () => localStorage.getItem('rememberMe') === 'true';

export const clearAuthSession = () => {
  AUTH_KEYS.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
  sessionStorage.removeItem(SESSION_MARKER_KEY);
};

export const setAuthSession = ({ token, user, rememberMe }) => {
  // Không gọi clearAuthSession ở đây để tránh mất dữ liệu tạm thời khi đang ghi
  const role = normalizeRole(user?.role || 'customer');

  const authData = {
    token: token,
    user: JSON.stringify({ ...user, role }),
    isLoggedIn: 'true',
    userRole: role,
    rememberMe: rememberMe ? 'true' : 'false'
  };

  // Lưu vào cả 2 nơi để đảm bảo tính nhất quán cao nhất
  Object.keys(authData).forEach(key => {
    localStorage.setItem(key, authData[key]);
    sessionStorage.setItem(key, authData[key]);
  });

  if (!rememberMe) {
    sessionStorage.setItem(SESSION_MARKER_KEY, 'true');
  }
};

// SỬA: Hàm này chỉ xóa nếu thực sự là customer, tránh xóa nhầm Admin
export const clearExpiredNonRememberedAuth = () => {
  const rememberFlag = localStorage.getItem('rememberMe');
  const activeSession = sessionStorage.getItem(SESSION_MARKER_KEY) === 'true';
  const role = getStoredUserRole();

  if (rememberFlag === 'false' && !activeSession && role === 'customer') {
    clearAuthSession();
  }
};

export const hasValidAuthSession = ({ allowRoles = null } = {}) => {
  const token = getAuthToken();
  const user = getStoredUser();
  const loggedInFlag = readFirst('isLoggedIn');

  if (!token || !user || loggedInFlag !== 'true') return false;
  
  if (isTokenExpired(token)) {
    clearAuthSession();
    return false;
  }

  if (Array.isArray(allowRoles) && allowRoles.length > 0) {
    const currentRole = getStoredUserRole();
    return allowRoles.map(normalizeRole).includes(currentRole);
  }

  return true;
};