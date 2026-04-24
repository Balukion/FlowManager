import { useAuthStore } from "@web/stores/auth.store";
import { useWorkspaceStore } from "@web/stores/workspace.store";
import { authService } from "@web/services/auth.service";
import { createAuthenticatedClient } from "@web/services/api.client";
import { getQueryClient } from "@web/lib/query-client";
import type { AuthResponse } from "@flowmanager/types";

export function useAuth() {
  const { user, accessToken, refreshToken, setAuth, clearAuth } = useAuthStore();
  const { setCurrentWorkspace } = useWorkspaceStore();

  async function login(email: string, password: string) {
    const response = (await authService.login(email, password)) as AuthResponse;
    setAuth(response.data.user, response.data.access_token, response.data.refresh_token);
    return response;
  }

  async function register(name: string, email: string, password: string) {
    const response = (await authService.register(name, email, password)) as AuthResponse;
    setAuth(response.data.user, response.data.access_token, response.data.refresh_token);
    return response;
  }

  async function logout() {
    if (accessToken && refreshToken) {
      await createAuthenticatedClient(accessToken)
        .post("/auth/logout", { refresh_token: refreshToken })
        .catch(() => {});
    }
    clearAuth();
    setCurrentWorkspace(null);
    getQueryClient().clear();
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
