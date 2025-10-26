const COGNITO_DOMAIN = import.meta.env.VITE_COGNITO_DOMAIN;
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI;

const ID_TOKEN_KEY = 'id_token';

/**
 * Build Cognito Hosted UI login URL with implicit flow
 */
export function buildLoginUrl(): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'token',
    scope: 'openid email profile',
    redirect_uri: REDIRECT_URI,
  });

  return `${COGNITO_DOMAIN}/login?${params.toString()}`;
}

/**
 * Parse id_token from URL hash fragment and store in localStorage
 * Returns true if token was found and stored
 */
export function parseAndStoreIdTokenFromHash(): boolean {
  const hash = window.location.hash.substring(1); // Remove #
  const params = new URLSearchParams(hash);
  const idToken = params.get('id_token');

  if (idToken) {
    localStorage.setItem(ID_TOKEN_KEY, idToken);
    // Clean up the URL
    window.history.replaceState(null, '', window.location.pathname);
    return true;
  }

  return false;
}

/**
 * Get stored ID token
 */
export function getIdToken(): string | null {
  return localStorage.getItem(ID_TOKEN_KEY);
}

/**
 * Check if user is signed in
 */
export function isSignedIn(): boolean {
  return getIdToken() !== null;
}

/**
 * Sign out: clear token and redirect to login
 */
export function signOut(): void {
  localStorage.removeItem(ID_TOKEN_KEY);
  window.location.href = '/login';
}

/**
 * Decode JWT token and extract user ID (sub claim)
 */
export function getUserId(): string | null {
  const token = getIdToken();
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub || null;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}
