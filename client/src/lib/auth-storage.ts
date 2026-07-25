const TOKEN_KEY =
  "radaraprende.auth.token";

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function saveAuthToken(
  token: string,
): void {
  localStorage.setItem(
    TOKEN_KEY,
    token,
  );
}

export function removeAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}