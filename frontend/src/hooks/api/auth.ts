import { api } from "@/lib/api";
import type { AuthRequiredResponse, AuthCheckResponse } from "@/types";

export async function fetchAuthRequired(): Promise<AuthRequiredResponse> {
  return api.get("auth/required").json();
}

export async function checkAuth(): Promise<AuthCheckResponse> {
  return api.get("auth/check").json();
}
