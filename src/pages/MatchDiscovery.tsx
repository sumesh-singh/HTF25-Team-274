import { useState } from "react";
import {
  Search,
  Star,
  Calendar,
  ChevronDown,
  X,
  Heart,
  MessageCircle,
  User,
  MapPin,
  Clock,
} from "lucide-react";
import {
  useMatchSuggestions,
  useFavoriteMatch,
  usePassMatch,
  useFilterMatches,
} from "../hooks/useMatches";
import { useCreateConversation } from "../hooks/useMessages";
import { MatchSuggestion, MatchFilters } from "../types/api";
import { useNavigate } from "react-router-dom";
import OnlineStatus from "../components/OnlineStatus";

interface MatchCardProps {
  match: MatchSuggestion;
  onFavorite: (matchId: string) => void;
  onPass: (matchId: string) => void;
  onMessage: (userId: string) => void;
}

const MatchCard = ({
  match,
  onFavorite,
  onPass,
  onMessage,
}: MatchCardProps) => {
  const navigate = useNavigate();

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-border-light bg-surface-light shadow-card transition-all duration-300 hover:shadow-card-hover dark:border-border-dark dark:bg-card-dark">
      <div className="flex-grow p-6">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              {match.user.avatar ? (
                <img
                  className="h-16 w-16 rounded-full object-cover"
                  src={match.user.avatar}
                  alt={`${match.user.firstName} ${match.user.lastName}`}
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
              )}
              <div className="absolute -bottom-1 -right-1">
                <OnlineStatus userId={match.user.id} size="sm" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {match.user.firstName} {match.user.lastName}
              </h3>
              <div className="flex items-center gap-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
                {match.user.location && (
                  <>
                    <MapPin className="h-3 w-3" />
                    <span>{match.user.location}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="relative group/button flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-secondary/10 transition-transform hover:scale-110 dark:bg-secondary/20">
            <span className="text-sm font-bold text-secondary">
              {Math.round(match.score)}%
            </span>
          </div>
        </div>

        {/* Match Explanation */}
        <div className="mb-4 p-3 bg-primary/5 rounded-lg">
          <p className="text-sm text-text-light-primary dark:text-text-dark-primary">
            {match.explanation}
          </p>
        </div>

        {/* Skill Matches */}
        {match.skillMatches && match.skillMatches.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-sm font-semibold">Skill Exchange:</p>
            <div className="space-y-2">
              {match.skillMatches.slice(0, 2).map((skillMatch, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full">
                    You teach: {skillMatch.teachingSkill.skill.name}
                  </span>
                  <span className="px-2 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full">
                    They teach: {skillMatch.learningSkill.skill.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-text-light-secondary dark:text-text-dark-secondary">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-amber-500" fill="currentColor" />
            <span className="font-semibold text-text-light-primary dark:text-text-dark-primary">
              {match.user.rating.toFixed(1)}
            </span>
            <span>({match.user.totalSessions})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>Active</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 border-t border-border-light bg-background-light p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:border-border-dark dark:bg-background-dark">
        <button
          onClick={() => onPass(match.id)}
          className="w-full rounded-lg border border-border-light bg-surface-light px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 dark:border-border-dark dark:bg-card-dark dark:hover:bg-slate-600"
        >
          Pass
        </button>
        <button
          onClick={() => onMessage(match.user.id)}
          className="w-full rounded-lg bg-blue-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 flex items-center justify-center gap-1"
        >
          <MessageCircle className="h-3 w-3" />
          Message
        </button>
        <button
          onClick={() => onFavorite(match.id)}
          className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 flex items-center justify-center gap-1"
        >
          <Heart className="h-3 w-3" />
          Favorite
        </button>
      </div>
    </div>
  );
};

interface Filter {
  skill: string[];
  availability: string[];
  rating: number | null;
  location: string[];
}

const MatchDiscovery = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Filter>({
    skill: [],
    availability: [],
    rating: null,
    location: [],
  });
  const [showFilters, setShowFilters] = useState(false);

  const skillOptions = [
    "Python",
    "Data Science",
    "UX Design",
    "Project Mgmt",
    "Spanish",
    "Creative Writing",
  ];
  const availabilityOptions = ["Weekdays", "Weekends", "Evenings", "Flexible"];
  const locationOptions = [
    "London, UK",
    "Berlin, DE",
    "Madrid, ES",
    "Tokyo, JP",
  ];

  const handleFilterChange = (
    category: keyof Filter,
    value: string | number
  ) => {
    setFilters((prev) => {
      if (category === "rating") {
        return { ...prev, [category]: value as number };
      }
      const currentValues = prev[category] as string[];
      return {
        ...prev,
        [category]: currentValues.includes(value as string)
          ? currentValues.filter((v) => v !== value)
          : [...currentValues, value as string],
      };
    });
  };

  const clearFilters = () => {
    setFilters({
      skill: [],
      availability: [],
      rating: null,
      location: [],
    });
    setSearchQuery("");
  };

  const filteredUsers = users.filter((user) => {
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      if (
        !user.name.toLowerCase().includes(searchLower) &&
        !user.skills.some((skill) =>
          skill.toLowerCase().includes(searchLower)
        ) &&
        !user.location.toLowerCase().includes(searchLower)
      ) {
        return false;
      }
    }

    if (
      filters.skill.length &&
      !filters.skill.some((skill) => user.skills.includes(skill))
    ) {
      return false;
    }

    if (
      filters.availability.length &&
      !filters.availability.includes(user.availability)
    ) {
      return false;
    }

    if (filters.location.length && !filters.location.includes(user.location)) {
      return false;
    }

    if (filters.rating && user.rating < filters.rating) {
      return false;
    }

    return true;
  });

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Search and Filters Header */}
      <div className="mb-8 flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-black tracking-tighter lg:text-4xl">
            Discover Your Match
          </h1>
          <button className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary/90">
            Post Your Skills
          </button>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-light-secondary dark:text-text-dark-secondary" />
            <input
              type="search"
              placeholder="Search by name, skills, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 w-full rounded-lg border border-border-light bg-surface-light pl-10 pr-4 text-text-light-primary placeholder:text-text-light-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-card-dark dark:text-text-dark-primary dark:placeholder:text-text-dark-secondary"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex h-12 items-center justify-center gap-2 rounded-lg border border-border-light bg-surface-light px-4 text-sm font-semibold transition-colors hover:bg-gray-100 dark:border-border-dark dark:bg-card-dark dark:hover:bg-slate-600"
          >
            Filters
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                showFilters ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="rounded-lg border border-border-light bg-surface-light p-6 dark:border-border-dark dark:bg-card-dark">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Filters</h2>
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 text-sm font-medium text-text-light-secondary hover:text-text-light-primary dark:text-text-dark-secondary dark:hover:text-text-dark-primary"
              >
                <X className="h-4 w-4" />
                Clear all
              </button>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {/* Skills Filter */}
              <div>
                <h3 className="mb-3 text-sm font-semibold">Skills</h3>
                <div className="space-y-2">
                  {skillOptions.map((skill) => (
                    <label key={skill} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={filters.skill.includes(skill)}
                        onChange={() => handleFilterChange("skill", skill)}
                        className="rounded border-border-light bg-surface-light text-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-card-dark"
                      />
                      <span className="text-sm">{skill}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Availability Filter */}
              <div>
                <h3 className="mb-3 text-sm font-semibold">Availability</h3>
                <div className="space-y-2">
                  {availabilityOptions.map((time) => (
                    <label key={time} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={filters.availability.includes(time)}
                        onChange={() =>
                          handleFilterChange("availability", time)
                        }
                        className="rounded border-border-light bg-surface-light text-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-card-dark"
                      />
                      <span className="text-sm">{time}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Rating Filter */}
              <div>
                <h3 className="mb-3 text-sm font-semibold">Minimum Rating</h3>
                <div className="space-y-2">
                  {[4, 4.5].map((rating) => (
                    <label key={rating} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="rating"
                        checked={filters.rating === rating}
                        onChange={() => handleFilterChange("rating", rating)}
                        className="rounded-full border-border-light bg-surface-light text-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-card-dark"
                      />
                      <span className="text-sm">{rating}+ stars</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Location Filter */}
              <div>
                <h3 className="mb-3 text-sm font-semibold">Location</h3>
                <div className="space-y-2">
                  {locationOptions.map((location) => (
                    <label key={location} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={filters.location.includes(location)}
                        onChange={() =>
                          handleFilterChange("location", location)
                        }
                        className="rounded border-border-light bg-surface-light text-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-card-dark"
                      />
                      <span className="text-sm">{location}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Filters */}
        {(filters.skill.length > 0 ||
          filters.availability.length > 0 ||
          filters.location.length > 0 ||
          filters.rating) && (
          <div className="flex flex-wrap items-center gap-2">
            {filters.skill.map((skill) => (
              <button
                key={skill}
                onClick={() => handleFilterChange("skill", skill)}
                className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/20 dark:bg-primary/20 dark:text-primary-light dark:hover:bg-primary/30"
              >
                {skill}
                <X className="h-3 w-3" />
              </button>
            ))}
            {filters.availability.map((time) => (
              <button
                key={time}
                onClick={() => handleFilterChange("availability", time)}
                className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/20 dark:bg-primary/20 dark:text-primary-light dark:hover:bg-primary/30"
              >
                {time}
                <X className="h-3 w-3" />
              </button>
            ))}
            {filters.location.map((location) => (
              <button
                key={location}
                onClick={() => handleFilterChange("location", location)}
                className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/20 dark:bg-primary/20 dark:text-primary-light dark:hover:bg-primary/30"
              >
                {location}
                <X className="h-3 w-3" />
              </button>
            ))}
            {filters.rating && (
              <button
                onClick={() => handleFilterChange("rating", 0)}
                className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/20 dark:bg-primary/20 dark:text-primary-light dark:hover:bg-primary/30"
              >
                {filters.rating}+ stars
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results Grid */}
      <div>
        <div className="mb-4">
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
            Showing{" "}
            <span className="font-bold text-text-light-primary dark:text-text-dark-primary">
              {filteredUsers.length}
            </span>{" "}
            potential matches
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredUsers.map((user, i) => (
            <MatchCard key={i} user={user} />
          ))}
        </div>

        {/* No Results Message */}
        {filteredUsers.length === 0 && (
          <div className="mt-8 text-center">
            <h3 className="text-xl font-bold">No matches found</h3>
            <p className="mt-2 text-text-light-secondary dark:text-text-dark-secondary">
              Try adjusting your filters or search criteria
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchDiscovery;
