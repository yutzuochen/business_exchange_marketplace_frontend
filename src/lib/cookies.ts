// Cookie utilities for JWT token management

export const COOKIE_NAMES = {
  AUTH_TOKEN: 'authToken',
} as const;

export function setCookie(name: string, value: string, days: number = 7): void {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax;Secure=${location.protocol === 'https:'}`;
}

export function getCookie(name: string): string | null {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  
  return null;
}

export function deleteCookie(name: string): void {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
}

export function getAuthToken(): string | null {
  return getCookie(COOKIE_NAMES.AUTH_TOKEN);
}

export function setAuthToken(token: string): void {
  setCookie(COOKIE_NAMES.AUTH_TOKEN, token, 7); // 7 days expiry
}

export function removeAuthToken(): void {
  deleteCookie(COOKIE_NAMES.AUTH_TOKEN);
}