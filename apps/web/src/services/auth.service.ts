import { api } from "./api.client";

export const authService = {
  login(email: string, password: string) {
    return api.post("/auth/login", { email, password });
  },

  register(name: string, email: string, password: string) {
    return api.post("/auth/register", { name, email, password });
  },

  refreshToken(refresh_token: string) {
    return api.post("/auth/refresh", { refresh_token });
  },

  forgotPassword(email: string) {
    return api.post("/auth/forgot-password", { email });
  },

  resetPassword(token: string, password: string) {
    return api.post("/auth/reset-password", { token, password });
  },

  verifyEmail(token: string) {
    return api.post("/auth/verify-email", { token });
  },
};
