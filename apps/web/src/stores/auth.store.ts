import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PublicUser } from "@flowmanager/types";

interface AuthState {
  user: PublicUser | null;
  accessToken: string | null;
  _hasHydrated: boolean;
  setAuth: (user: PublicUser, accessToken: string) => void;
  clearAuth: () => void;
  setHasHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      _hasHydrated: false,
      setAuth: (user, accessToken) => set({ user, accessToken }),
      clearAuth: () => set({ user: null, accessToken: null }),
      setHasHydrated: (value) => set({ _hasHydrated: value }),
    }),
    {
      name: "flowmanager-auth",
      skipHydration: true,
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
