import { useMemo } from "react";
import { createAuthenticatedClient, type AuthenticatedClient } from "@web/services/api.client";
import { useAuthStore } from "@web/stores/auth.store";

export function useApiClient(): AuthenticatedClient {
  const { accessToken } = useAuthStore();
  return useMemo(() => createAuthenticatedClient(accessToken!), [accessToken]);
}
