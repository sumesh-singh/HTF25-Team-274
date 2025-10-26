import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Filter,
  X,
  ChevronDown,
  SlidersHorizontal,
} from "lucide-react";

interface SearchFilter {
  key: string;
  label: string;
  type: "select" | "multiselect" | "range" | "boolean";
  options?: Array<{ value: string | number; label: string }>;
  min?: number;
  max?: number;
  step?: number;
}

interface AdvancedSearchProps {
  placeholder?: string;
  filters?: SearchFilter[];
  onSearch: (query: string, filters: Record<string, any>) => void;
  className?: string;
  showFilterCount?: boolean;
}

export const AdvancedSearch = ({
  placeholder = "Search...",
  filters = [],
  onSearch,
  className = "",
  showFilterCount = true,
}: AdvancedSearchProps) => {
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load search history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("skillsync-search-history");
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch (error) {
        console.error("Failed to load search history:", error);
      }
    }
  }, []);

  // Save search history to localStorage
  const saveSearchHistory = (newHistory: string[]) => {
    try {
      localStorage.setItem(
        "skillsync-search-history",
        JSON.stringify(newHistory)
      );
    } catch (error) {
      console.error("Failed to save search history:", error);
    }
  };

  // Handle search submission
  const handleSearch = (searchQuery?: string) => {
    const finalQuery = searchQuery || query;

    if (finalQuery.trim()) {
      // Add to search history
      const newHistory = [
        finalQuery,
        ...searchHistory.filter((h) => h !== finalQuery),
      ].slice(0, 10);
      setSearchHistory(newHistory);
      saveSearchHistory(newHistory);
    }

    onSearch(finalQuery, activeFilters);
    setShowHistory(false);
  };

  // Handle filter changes
  const handleFilterChange = (filterKey: string, value: any) => {
    const newFilters = { ...activeFilters };

    if (
      value === null ||
      value === undefined ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    ) {
      delete newFilters[filterKey];
    } else {
      newFilters[filterKey] = value;
    }

    setActiveFilters(newFilters);
    onSearch(query, newFilters);
  };

  // Clear all filters
  const clearFilters = () => {
    setActiveFilters({});
    onSearch(query, {});
  };

  // Clear search history
  const clearHistory = () => {
    setSearchHistory([]);
    saveSearchHistory([]);
  };

  // Get active filter count
  const activeFilterCount = Object.keys(activeFilters).length;

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowHistory(false);
        setShowFilters(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const renderFilter = (filter: SearchFilter) => {
    const value = activeFilters[filter.key];

    switch (filter.type) {
      case "select":
        return (
          <div key={filter.key} className="space-y-2">
            <label className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
              {filter.label}
            </label>
            <select
              value={value || ""}
              onChange={(e) =>
                handleFilterChange(filter.key, e.target.value || null)
              }
              className="w-full p-2 border border-border-light dark:border-border-dark rounded-lg bg-transparent text-sm"
            >
              <option value="">All</option>
              {filter.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );

      case "multiselect":
        return (
          <div key={filter.key} className="space-y-2">
            <label className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
              {filter.label}
            </label>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {filter.options?.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={(value || []).includes(option.value)}
                    onChange={(e) => {
                      const currentValues = value || [];
                      const newValues = e.target.checked
                        ? [...currentValues, option.value]
                        : currentValues.filter((v: any) => v !== option.value);
                      handleFilterChange(filter.key, newValues);
                    }}
                    className="rounded border-border-light dark:border-border-dark"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>
        );

      case "range":
        return (
          <div key={filter.key} className="space-y-2">
            <label className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
              {filter.label}: {value || filter.min}
            </label>
            <input
              type="range"
              min={filter.min}
              max={filter.max}
              step={filter.step || 1}
              value={value || filter.min}
              onChange={(e) =>
                handleFilterChange(filter.key, Number(e.target.value))
              }
              className="w-full"
            />
            <div className="flex justify-between text-xs text-text-light-secondary dark:text-text-dark-secondary">
              <span>{filter.min}</span>
              <span>{filter.max}</span>
            </div>
          </div>
        );

      case "boolean":
        return (
          <div key={filter.key} className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={value || false}
                onChange={(e) =>
                  handleFilterChange(filter.key, e.target.checked)
                }
                className="rounded border-border-light dark:border-border-dark"
              />
              {filter.label}
            </label>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-light-secondary dark:text-text-dark-secondary" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            } else if (e.key === "ArrowDown" && searchHistory.length > 0) {
              setShowHistory(true);
            }
          }}
          onFocus={() => {
            if (searchHistory.length > 0) {
              setShowHistory(true);
            }
          }}
          className="w-full pl-10 pr-20 py-3 border border-border-light dark:border-border-dark rounded-lg bg-transparent focus:border-primary focus:ring-2 focus:ring-primary/20"
        />

        {/* Filter Toggle Button */}
        {filters.length > 0 && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`absolute right-12 top-1/2 transform -translate-y-1/2 p-1 rounded hover:bg-primary/10 transition-colors ${
              showFilters
                ? "text-primary"
                : "text-text-light-secondary dark:text-text-dark-secondary"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {showFilterCount && activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        )}

        {/* Search Button */}
        <button
          onClick={() => handleSearch()}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-primary text-white rounded hover:bg-primary-hover transition-colors"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>

      {/* Search History Dropdown */}
      {showHistory && searchHistory.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-lg shadow-lg z-50">
          <div className="p-2 border-b border-border-light dark:border-border-dark flex justify-between items-center">
            <span className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary">
              Recent Searches
            </span>
            <button
              onClick={clearHistory}
              className="text-xs text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary"
            >
              Clear
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {searchHistory.map((historyItem, index) => (
              <button
                key={index}
                onClick={() => {
                  setQuery(historyItem);
                  handleSearch(historyItem);
                }}
                className="w-full text-left px-3 py-2 hover:bg-primary/5 transition-colors text-sm"
              >
                {historyItem}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && filters.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-lg shadow-lg z-40 p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-text-light-primary dark:text-text-dark-primary">
              Filters
            </h3>
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary"
                >
                  Clear all
                </button>
              )}
              <button
                onClick={() => setShowFilters(false)}
                className="text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filters.map(renderFilter)}
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {Object.entries(activeFilters).map(([key, value]) => {
            const filter = filters.find((f) => f.key === key);
            if (!filter) return null;

            let displayValue = value;
            if (Array.isArray(value)) {
              displayValue = value.join(", ");
            } else if (filter.options) {
              const option = filter.options.find((o) => o.value === value);
              displayValue = option?.label || value;
            }

            return (
              <button
                key={key}
                onClick={() => handleFilterChange(key, null)}
                className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs hover:bg-primary/20 transition-colors"
              >
                <span>
                  {filter.label}: {displayValue}
                </span>
                <X className="h-3 w-3" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;
