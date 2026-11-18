export interface AdminCredentials {
  username: string;
  password: string;
  passwordHint?: string;
  showHintOnLoginPage?: boolean;
  lastUpdated?: string;
}

const AUTH_CONFIG_KEY = 'wedding_portal_admin_config_v1';
const AUTH_SESSION_KEY = 'wedding_portal_auth_session_v1';

const DEFAULT_CREDENTIALS: {
  username: string;
  password: string;
  passwordHint: string;
  showHintOnLoginPage: boolean;
} = {
  username: 'admin',
  password: 'wedding2025',
  passwordHint: 'Default demo password is wedding2025',
  showHintOnLoginPage: true,
};

/**
 * Retrieves the current admin credentials and security settings from local storage
 */
export function getAdminCredentials(): { 
  username: string; 
  password: string; 
  passwordHint: string; 
  showHintOnLoginPage: boolean;
} {
  try {
    const raw = localStorage.getItem(AUTH_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.username && parsed.password) {
        return { 
          username: parsed.username, 
          password: parsed.password,
          passwordHint: parsed.passwordHint !== undefined ? parsed.passwordHint : DEFAULT_CREDENTIALS.passwordHint,
          showHintOnLoginPage: parsed.showHintOnLoginPage !== undefined ? parsed.showHintOnLoginPage : true,
        };
      }
    }
  } catch (err) {
    console.error('Error loading admin credentials:', err);
  }
  return { ...DEFAULT_CREDENTIALS };
}

/**
 * Fetches server credentials on app startup to stay in sync
 */
export async function syncServerCredentials(): Promise<void> {
  try {
    const res = await fetch('/api/auth/creds');
    if (res.ok) {
      const creds = await res.json();
      if (creds && creds.username && creds.password) {
        localStorage.setItem(AUTH_CONFIG_KEY, JSON.stringify(creds));
      }
    }
  } catch (_) {}
}

/**
 * Updates the admin credentials (User ID, Password, Password Hint, and Hint Visibility)
 */
export function updateAdminCredentials(
  newUsername: string, 
  newPassword: string,
  newPasswordHint?: string,
  showHintOnLoginPage = true
): boolean {
  if (!newUsername.trim() || !newPassword.trim()) {
    return false;
  }
  try {
    const data = {
      username: newUsername.trim(),
      password: newPassword.trim(),
      passwordHint: newPasswordHint !== undefined ? newPasswordHint.trim() : '',
      showHintOnLoginPage: Boolean(showHintOnLoginPage),
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(AUTH_CONFIG_KEY, JSON.stringify(data));

    // Save to server
    fetch('/api/auth/creds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).catch(() => {});

    return true;
  } catch (err) {
    console.error('Error saving admin credentials:', err);
    return false;
  }
}

/**
 * Checks if the current browser session is authenticated as Admin
 */
export function isAdminAuthenticated(): boolean {
  try {
    const sessionToken = sessionStorage.getItem(AUTH_SESSION_KEY) || localStorage.getItem(AUTH_SESSION_KEY);
    if (!sessionToken) return false;
    
    const parsed = JSON.parse(sessionToken);
    if (parsed && parsed.authenticated && parsed.username) {
      return true;
    }
  } catch (err) {
    console.error('Error checking auth state:', err);
  }
  return false;
}

/**
 * Logs in the admin user
 */
export function loginAdmin(usernameInput: string, passwordInput: string, rememberMe = true): boolean {
  const currentCreds = getAdminCredentials();
  
  if (
    usernameInput.trim().toLowerCase() === currentCreds.username.toLowerCase() &&
    passwordInput.trim() === currentCreds.password
  ) {
    const sessionPayload = JSON.stringify({
      authenticated: true,
      username: currentCreds.username,
      loggedInAt: new Date().toISOString(),
    });

    if (rememberMe) {
      localStorage.setItem(AUTH_SESSION_KEY, sessionPayload);
    } else {
      sessionStorage.setItem(AUTH_SESSION_KEY, sessionPayload);
    }
    return true;
  }
  return false;
}

/**
 * Logs out the admin user
 */
export function logoutAdmin(): void {
  try {
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    localStorage.removeItem(AUTH_SESSION_KEY);
  } catch (err) {
    console.error('Error logging out:', err);
  }
}

/**
 * Resets admin credentials to defaults (admin / wedding2025)
 */
export function resetAdminCredentialsToDefault(): void {
  try {
    localStorage.removeItem(AUTH_CONFIG_KEY);
    logoutAdmin();
    fetch('/api/auth/creds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(DEFAULT_CREDENTIALS),
    }).catch(() => {});
  } catch (err) {
    console.error('Error resetting credentials:', err);
  }
}
