import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../stores/authStore";
import { authService } from "../services/authService";
import { User } from "../types/api";

export const useAuth = () => {
  const authStore = useAuthStore();
  return authStore;
};

export const useProfile = () => {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ["profile"],
    queryFn: authService.getProfile,
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { updateUser } = useAuthStore();

  return useMutation({
    mutationFn: (data: Partial<User>) => authService.updateProfile(data),
    onSuccess: (updatedUser) => {
      // Update the auth store
      updateUser(updatedUser);

      // Update the profile query cache
      queryClient.setQueryData(["profile"], updatedUser);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};

export const useUploadAvatar = () => {
  const queryClient = useQueryClient();
  const { updateUser } = useAuthStore();

  return useMutation({
    mutationFn: ({
      file,
      onProgress,
    }: {
      file: File;
      onProgress?: (progress: number) => void;
    }) => authService.uploadAvatar(file, onProgress),
    onSuccess: (response) => {
      // Update user avatar in auth store
      updateUser({ avatar: response.url });

      // Update profile query cache
      queryClient.setQueryData(["profile"], (oldData: User | undefined) =>
        oldData ? { ...oldData, avatar: response.url } : oldData
      );

      // Invalidate profile query
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (email: string) => authService.forgotPassword(email),
  });
};

export const useResetPassword = () => {
  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      authService.resetPassword(token, password),
  });
};

export const useDeleteAccount = () => {
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.deleteAccount,
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();

      // Logout user
      logout();
    },
  });
};
