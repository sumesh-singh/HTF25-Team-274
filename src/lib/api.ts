import axios, { AxiosInstance, AxiosResponse, AxiosError } from "axios";
import { ApiResponse, ApiError } from "../types/api";

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL =
      import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1";

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("accessToken");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle errors and token refresh
    this.client.interceptors.response.use(
      (response: AxiosResponse<ApiResponse<any>>) => response,
      async (error: AxiosError<ApiError>) => {
        const originalRequest = error.config;

        if (
          error.response?.status === 401 &&
          originalRequest &&
          !originalRequest._retry
        ) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem("refreshToken");
            if (refreshToken) {
              const response = await this.client.post("/auth/refresh", {
                refreshToken,
              });

              const { accessToken } = response.data.data;
              localStorage.setItem("accessToken", accessToken);

              // Retry the original request with new token
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            window.location.href = "/login";
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Generic request methods
  async get<T>(url: string, params?: any): Promise<T> {
    const response = await this.client.get<ApiResponse<T>>(url, { params });
    return response.data.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.post<ApiResponse<T>>(url, data);
    return response.data.data;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.put<ApiResponse<T>>(url, data);
    return response.data.data;
  }

  async patch<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.patch<ApiResponse<T>>(url, data);
    return response.data.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<ApiResponse<T>>(url);
    return response.data.data;
  }

  // File upload method
  async uploadFile<T>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<T> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await this.client.post<ApiResponse<T>>(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(progress);
        }
      },
    });

    return response.data.data;
  }

  // Get raw axios instance for special cases
  getClient(): AxiosInstance {
    return this.client;
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Export for use in React Query
export default apiClient;
