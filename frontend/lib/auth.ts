export function saveToken(token: string) {
  localStorage.setItem("nutrieats_token", token);
}

export function getToken(): string | null {
  return localStorage.getItem("nutrieats_token");
}

export function removeToken() {
  localStorage.removeItem("nutrieats_token");
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

interface JwtPayload {
  userId: string;
  role: string;
  exp: number;
}

export function decodeToken(token: string): JwtPayload | null {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload)) as JwtPayload;
  } catch {
    return null;
  }
}
