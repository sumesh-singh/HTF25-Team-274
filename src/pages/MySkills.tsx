import React, { useState } from "react";
import {
  Plus,
  Search,
  Filter,
  BookOpen,
  GraduationCap,
  Star,
  Shield,
  Edit,
  Trash2,
  Award,
} from "lucide-react";
import {
  useUserSkills,
  useSkills,
  useAddUserSkill,
  useUpdateUserSkill,
  useDeleteUserSkill,
  useRequestSkillVerification,
} from "../hooks/useSkills";
import { useAuth } from "../hooks/useAuth";
import { UserSkill, Skill, UpdateSkillRequest } from "../types/api";

interface SkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  skill?: UserSkill;
  allSkills: Skill[];
  onSave: (skillId: string, data: UpdateSkillRequest) => void;
}

const SkillModal = ({
  isOpen,
  onClose,
  skill,
  allSkills,
  onSave,
}: SkillModalProps) => {
  const [selectedSkillId, setSelectedSkillId] = useState(skill?.skillId || "");
  const [proficiencyLevel, setProficiencyLevel] = useState(
    skill?.proficiencyLevel || 50
  );
  const [canTeach, setCanTeach] = useState(skill?.canTeach || false);
  const [wantsToLearn, setWantsToLearn] = useState(skill?.wantsToLearn || true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSkillId) return;

    onSave(selectedSkillId, {
      proficiencyLevel,
      canTeach,
      wantsToLearn,
    });
    onClose();
  };

  const getProficiencyLabel = (level: number) => {
    if (level <= 25) return "Beginner";
    if (level <= 60) return "Intermediate";
    if (level <= 85) return "Advanced";
    return "Expert";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card-light dark:bg-card-dark rounded-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4">
          {skill ? "Edit Skill" : "Add New Skill"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Skill</label>
            <select
              value={selectedSkillId}
              onChange={(e) => setSelectedSkillId(e.target.value)}
              disabled={!!skill}
              className="w-full p-3 border border-border-light dark:border-border-dark rounded-lg bg-transparent"
              required
            >
              <option value="">Select a skill</option>
              {allSkills.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Proficiency Level: {proficiencyLevel}% (
              {getProficiencyLabel(proficiencyLevel)})
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={proficiencyLevel}
              onChange={(e) => setProficiencyLevel(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={canTeach}
                onChange={(e) => setCanTeach(e.target.checked)}
                className="rounded"
              />
              <span>I can teach this skill</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={wantsToLearn}
                onChange={(e) => setWantsToLearn(e.target.checked)}
                className="rounded"
              />
              <span>I want to learn more about this skill</span>
            </label>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border-light dark:border-border-dark rounded-lg hover:bg-primary/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover"
            >
              {skill ? "Update" : "Add"} Skill
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const MySkills: React.FC = () => {
  const { user } = useAuth();
  const { data: userSkills, isLoading: skillsLoading } = useUserSkills();
  const { data: allSkills } = useSkills();
  const addSkillMutation = useAddUserSkill();
  const updateSkillMutation = useUpdateUserSkill();
  const deleteSkillMutation = useDeleteUserSkill();
  const requestVerificationMutation = useRequestSkillVerification();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "teaching" | "learning">(
    "all"
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<UserSkill | undefined>();

  const filteredSkills =
    userSkills?.filter((skill) => {
      const matchesSearch =
        skill.skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        skill.skill.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter =
        filterType === "all" ||
        (filterType === "teaching" && skill.canTeach) ||
        (filterType === "learning" && skill.wantsToLearn);

      return matchesSearch && matchesFilter;
    }) || [];

  const handleAddSkill = (skillId: string, data: UpdateSkillRequest) => {
    addSkillMutation.mutate({ skillId, data });
  };

  const handleUpdateSkill = (skillId: string, data: UpdateSkillRequest) => {
    if (editingSkill) {
      updateSkillMutation.mutate({ userSkillId: editingSkill.id, data });
    }
  };

  const handleDeleteSkill = (userSkillId: string) => {
    if (confirm("Are you sure you want to delete this skill?")) {
      deleteSkillMutation.mutate(userSkillId);
    }
  };

  const handleRequestVerification = (userSkillId: string) => {
    requestVerificationMutation.mutate(userSkillId);
  };

  const openAddModal = () => {
    setEditingSkill(undefined);
    setIsModalOpen(true);
  };

  const openEditModal = (skill: UserSkill) => {
    setEditingSkill(skill);
    setIsModalOpen(true);
  };

  const getProficiencyColor = (level: number) => {
    if (level <= 25) return "bg-red-500";
    if (level <= 60) return "bg-yellow-500";
    if (level <= 85) return "bg-blue-500";
    return "bg-green-500";
  };

  const getProficiencyLabel = (level: number) => {
    if (level <= 25) return "Beginner";
    if (level <= 60) return "Intermediate";
    if (level <= 85) return "Advanced";
    return "Expert";
  };

  if (skillsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-light-primary dark:text-text-dark-primary">
            My Skills
          </h1>
          <p className="text-text-light-secondary dark:text-text-dark-secondary mt-1">
            Manage your skills and expertise
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Skill
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-light-secondary dark:text-text-dark-secondary" />
          <input
            type="text"
            placeholder="Search skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-transparent"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-text-light-secondary dark:text-text-dark-secondary" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-transparent"
          >
            <option value="all">All Skills</option>
            <option value="teaching">Teaching</option>
            <option value="learning">Learning</option>
          </select>
        </div>
      </div>

      {/* Skills Grid */}
      {filteredSkills.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-text-light-secondary dark:text-text-dark-secondary mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
            No skills found
          </h3>
          <p className="text-text-light-secondary dark:text-text-dark-secondary mb-4">
            {searchTerm || filterType !== "all"
              ? "Try adjusting your search or filter criteria"
              : "Start building your skill profile by adding your first skill"}
          </p>
          {!searchTerm && filterType === "all" && (
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
            >
              Add Your First Skill
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSkills.map((userSkill) => (
            <div
              key={userSkill.id}
              className="bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-xl p-6 hover:shadow-lg transition-shadow"
            >
              {/* Skill Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-text-light-primary dark:text-text-dark-primary">
                    {userSkill.skill.name}
                  </h3>
                  <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                    {userSkill.skill.category}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  {userSkill.isVerified && (
                    <div
                      className="p-1 bg-green-500/10 rounded-full"
                      title="Verified Skill"
                    >
                      <Shield className="h-4 w-4 text-green-500" />
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(userSkill)}
                      className="p-1 hover:bg-primary/10 rounded"
                      title="Edit Skill"
                    >
                      <Edit className="h-4 w-4 text-text-light-secondary dark:text-text-dark-secondary" />
                    </button>
                    <button
                      onClick={() => handleDeleteSkill(userSkill.id)}
                      className="p-1 hover:bg-red-500/10 rounded"
                      title="Delete Skill"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Proficiency Level */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Proficiency</span>
                  <span className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                    {getProficiencyLabel(userSkill.proficiencyLevel)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getProficiencyColor(
                      userSkill.proficiencyLevel
                    )}`}
                    style={{ width: `${userSkill.proficiencyLevel}%` }}
                  />
                </div>
              </div>

              {/* Skill Type Badges */}
              <div className="flex gap-2 mb-4">
                {userSkill.canTeach && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full text-xs">
                    <GraduationCap className="h-3 w-3" />
                    Teaching
                  </span>
                )}
                {userSkill.wantsToLearn && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-xs">
                    <BookOpen className="h-3 w-3" />
                    Learning
                  </span>
                )}
              </div>

              {/* Verification */}
              {!userSkill.isVerified && userSkill.canTeach && (
                <button
                  onClick={() => handleRequestVerification(userSkill.id)}
                  disabled={requestVerificationMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-primary text-primary rounded-lg hover:bg-primary/5 transition-colors disabled:opacity-50"
                >
                  <Award className="h-4 w-4" />
                  Request Verification
                </button>
              )}

              {userSkill.isVerified && (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
                  <Shield className="h-4 w-4" />
                  <span>Verified by {userSkill.verificationCount} peers</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Skill Modal */}
      <SkillModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        skill={editingSkill}
        allSkills={allSkills || []}
        onSave={editingSkill ? handleUpdateSkill : handleAddSkill}
      />
    </div>
  );
};

export default MySkills;
