import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { skillsService } from "../services/skillsService";
import { UpdateSkillRequest } from "../types/api";

export const useSkills = () => {
  return useQuery({
    queryKey: ["skills"],
    queryFn: skillsService.getAllSkills,
    staleTime: 30 * 60 * 1000, // 30 minutes - skills don't change often
  });
};

export const useSkillCategories = () => {
  return useQuery({
    queryKey: ["skill-categories"],
    queryFn: skillsService.getSkillCategories,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const useUserSkills = (userId?: string) => {
  return useQuery({
    queryKey: ["user-skills", userId],
    queryFn: () => skillsService.getUserSkills(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useAddUserSkill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      skillId,
      data,
    }: {
      skillId: string;
      data: UpdateSkillRequest;
    }) => skillsService.addUserSkill(skillId, data),
    onSuccess: (_, variables) => {
      // Invalidate user skills queries
      queryClient.invalidateQueries({ queryKey: ["user-skills"] });

      // Invalidate match suggestions since skills changed
      queryClient.invalidateQueries({ queryKey: ["match-suggestions"] });
    },
  });
};

export const useUpdateUserSkill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userSkillId,
      data,
    }: {
      userSkillId: string;
      data: UpdateSkillRequest;
    }) => skillsService.updateUserSkill(userSkillId, data),
    onSuccess: () => {
      // Invalidate user skills queries
      queryClient.invalidateQueries({ queryKey: ["user-skills"] });

      // Invalidate match suggestions
      queryClient.invalidateQueries({ queryKey: ["match-suggestions"] });
    },
  });
};

export const useDeleteUserSkill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userSkillId: string) =>
      skillsService.deleteUserSkill(userSkillId),
    onSuccess: () => {
      // Invalidate user skills queries
      queryClient.invalidateQueries({ queryKey: ["user-skills"] });

      // Invalidate match suggestions
      queryClient.invalidateQueries({ queryKey: ["match-suggestions"] });
    },
  });
};

export const useRequestSkillVerification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userSkillId: string) =>
      skillsService.requestVerification(userSkillId),
    onSuccess: () => {
      // Invalidate user skills to show verification request status
      queryClient.invalidateQueries({ queryKey: ["user-skills"] });
    },
  });
};

export const useVerifyUserSkill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userSkillId,
      rating,
      comment,
    }: {
      userSkillId: string;
      rating: number;
      comment?: string;
    }) => skillsService.verifyUserSkill(userSkillId, rating, comment),
    onSuccess: () => {
      // Invalidate verification requests
      queryClient.invalidateQueries({ queryKey: ["verification-requests"] });

      // Invalidate user skills
      queryClient.invalidateQueries({ queryKey: ["user-skills"] });
    },
  });
};

export const useVerificationRequests = () => {
  return useQuery({
    queryKey: ["verification-requests"],
    queryFn: skillsService.getVerificationRequests,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useRequestNewSkill = () => {
  return useMutation({
    mutationFn: ({
      name,
      category,
      description,
    }: {
      name: string;
      category: string;
      description?: string;
    }) => skillsService.requestNewSkill(name, category, description),
  });
};
