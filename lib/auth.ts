const ADMIN_EMAIL = 'admin@exemplo.com';
const ADMIN_PASSWORD = '123456';

export async function signIn(email: string, password: string) {
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    return { success: true, user: { email: ADMIN_EMAIL } };
  }
  return { success: false, error: 'Credenciais inválidas' };
}

export function getSession() {
  if (typeof window === 'undefined') {
    return null;
  }

  const session = sessionStorage.getItem('admin_session');
  if (!session) return null;

  try {
    return JSON.parse(session);
  } catch {
    return null;
  }
}

export function setSession(user: { email: string }) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem('admin_session', JSON.stringify(user));
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem('admin_session');
}
