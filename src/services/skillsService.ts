import { apiClient } from "../lib/api";
import {
  Skill,
  UserSkill,
  SkillCategory,
  UpdateSkillRequest,
} from "../types/api";

export const skillsService = {
  // Skills taxonomy
  getAllSkills: (): Promise<Skill[]> => apiClient.get("/skills"),

  getSkillCategories: (): Promise<SkillCategory[]> =>
    apiClient.get("/skills/categories"),

  requestNewSkill: (
    name: string,
    category: string,
    description?: string
  ): Promise<void> =>
    apiClient.post("/skills/request", { name, category, description }),

  // User skills
  getUserSkills: (userId?: string): Promise<UserSkill[]> =>
    apiClient.get(userId ? `/users/${userId}/skills` : "/users/skills"),

  addUserSkill: (
    skillId: string,
    data: UpdateSkillRequest
  ): Promise<UserSkill> =>
    apiClient.post("/users/skills", { skillId, ...data }),

  updateUserSkill: (
    userSkillId: string,
    data: UpdateSkillRequest
  ): Promise<UserSkill> => apiClient.put(`/users/skills/${userSkillId}`, data),

  deleteUserSkill: (userSkillId: string): Promise<void> =>
    apiClient.delete(`/users/skills/${userSkillId}`),

  // Skill verification
  requestVerification: (userSkillId: string): Promise<void> =>
    apiClient.post(`/users/skills/${userSkillId}/verify`),

  verifyUserSkill: (
    userSkillId: string,
    rating: number,
    comment?: string
  ): Promise<void> =>
    apiClient.post(`/skills/verify/${userSkillId}`, { rating, comment }),

  getVerificationRequests: (): Promise<UserSkill[]> =>
    apiClient.get("/skills/verification-requests"),
};
