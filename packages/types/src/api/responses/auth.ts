import type { PublicUser } from "../../entities/user.js";

export interface AuthResponse {
  data: {
    user: PublicUser;
    access_token: string;
    refresh_token: string;
  };
}

export interface RefreshTokenResponse {
  data: {
    access_token: string;
    refresh_token: string;
  };
}
