import { useAuthStore } from "../stores/auth.store.js";
import { authService } from "../services/auth.service.js";
import type { AuthResponse } from "@flowmanager/types";

export function useAuth() {
  const { user, accessToken, setAuth, clearAuth } = useAuthStore();

  async function login(email: string, password: string) {
    const response = (await authService.login(email, password)) as AuthResponse;
    setAuth(response.data.user, response.data.access_token);
    return response;
  }

  async function register(name: string, email: string, password: string) {
    const response = (await authService.register(name, email, password)) as AuthResponse;
    setAuth(response.data.user, response.data.access_token);
    return response;
  }

  async function logout() {
    if (accessToken) {
      await authService.logout(accessToken).catch(() => {});
    }
    clearAuth();
  }

  return {
    user,
    accessToken,
    isAuthenticated: user !== null && accessToken !== null,
    login,
    register,
    logout,
  };
}
