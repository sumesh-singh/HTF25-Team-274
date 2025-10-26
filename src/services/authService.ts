import { apiClient } from "../lib/api";
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
} from "../types/api";

export const authService = {
  // Authentication
  login: (credentials: LoginRequest): Promise<AuthResponse> =>
    apiClient.post("/auth/login", credentials),

  register: (userData: RegisterRequest): Promise<AuthResponse> =>
    apiClient.post("/auth/register", userData),

  logout: (): Promise<void> => apiClient.post("/auth/logout"),

  refreshToken: (refreshToken: string): Promise<{ accessToken: string }> =>
    apiClient.post("/auth/refresh", { refreshToken }),

  forgotPassword: (email: string): Promise<void> =>
    apiClient.post("/auth/forgot-password", { email }),

  resetPassword: (token: string, password: string): Promise<void> =>
    apiClient.post("/auth/reset-password", { token, password }),

  // OAuth
  googleAuth: (code: string): Promise<AuthResponse> =>
    apiClient.post("/auth/google", { code }),

  linkedinAuth: (code: string): Promise<AuthResponse> =>
    apiClient.post("/auth/linkedin", { code }),

  // Profile
  getProfile: (): Promise<User> => apiClient.get("/users/profile"),

  updateProfile: (data: Partial<User>): Promise<User> =>
    apiClient.put("/users/profile", data),

  uploadAvatar: (
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<{ url: string }> =>
    apiClient.uploadFile("/users/avatar", file, onProgress),

  deleteAccount: (): Promise<void> => apiClient.delete("/users/account"),
};
