import ky from "ky";

const AUTH_TOKEN_KEY = "auth_token";

export function getStoredToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export const api = ky.create({
  prefixUrl: "/api",
  timeout: 15_000,
  hooks: {
    beforeRequest: [
      (request) => {
        const token = getStoredToken();
        if (token) {
          request.headers.set("Authorization", `Bearer ${token}`);
        }
      },
    ],
    afterResponse: [
      (_request, _options, response) => {
        if (response.status === 401) {
          clearStoredToken();
          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
        }
      },
    ],
  },
});
