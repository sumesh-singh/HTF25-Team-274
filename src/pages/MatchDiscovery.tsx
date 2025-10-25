import { useState } from 'react';
import { Search, Star, Calendar, ChevronDown, X } from 'lucide-react';

// Mock Data
const users = [
    { name: 'Sarah Doe', location: 'London, UK', match: '95%', skills: ['Python', 'Data Science', 'SQL'], rating: 4.9, reviews: 42, availability: 'Weekends', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCvYt3FykHy5eIaxFAkrkCObXAPHk0qlgraIBeSvcJcsde0UTSOpukQVzxPz4uv1IB8uBIMJekoV35Q3vNXI00LYe6CVeM4YErr8SZIwrZ1VbFYePV5WbE5HlGokba_tqzXnj9s4hR2o__OxHWM0JQbKgJnlotTyx5N-hdU2OQLYb1HrpZdipdg147N--S6ESNR6ccuAJnOOSF8wS9moUkfR9LIc9nMVL-8ztr2qk3dwLUL3_IMqYQnCiymNelSYsEbF_zr7qGiY6F0' },
    { name: 'John Smith', location: 'Berlin, DE', match: '91%', skills: ['UX Design', 'Figma'], rating: 4.8, reviews: 29, availability: 'Evenings', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBkwY7Al7N2i_2afTL4ma8_-YH2KNPubxfUnDrvkceLoogoe8PNgVOAkjdujMOhwVNrGNBKNTd0mdB3MwyraHhmeqig_ddgqQeBl5GFwrauod-_D3V0GP91KCTHu_y85jOTO-WJSyRMZP6vXeSCfZK1aR4PvQ65cZklddABNgnMyt76-5LNM3M1L4ry9aD5rFhZGnvU4c8zlr23kguwMia2gzHcQYSxeFwlxXittcV4N4Tc0b7k4Qrxao1lz3QoZsFOccXFBE6H3Zv5' },
    { name: 'Maria Garcia', location: 'Madrid, ES', match: '88%', skills: ['Spanish', 'Creative Writing'], rating: 5.0, reviews: 15, availability: 'Flexible', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBo0k0X1tBjErZ3RSv9Eo6cm3MdaCtYkN0w9lhzVkkWUxHwHyo997vRVgIjBW6rmV6iICd3963BYPrkMtlQ-FLt7uBnINoQJmSgkffyF13z1pfFefqqZ7IBVYYSMdQ9YiqAcVQEXGUmyUaCMuRc9iN044fFrSpA7RHuYCz47oQLLIVUdkwQAd8MdKj9tEClG3Taotfqzwh984b6K1BGqLnM-6SK9yCL-dt6eqjT4HJnkezbiF1zKu7KIDBkANlYyAUNsShaXmEBTurX' },
    { name: 'Chen Wei', location: 'Tokyo, JP', match: '85%', skills: ['Project Mgmt', 'Agile'], rating: 4.7, reviews: 33, availability: 'Weekdays', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBGVAorR5iwL__IpiQHzFKT9RZx0L0XDG5DKyQs0Xa_vHf3-2preJeAJZtulvdQAnYphRU3PVai4JOQdQWTZ-cac-2o0Mr67VzO8tGs6q0lRnXiXRcLw0r3syuI60HOM-cVO1_J-Cc9ReCP_nfM6MGZA8Y2PuYTB_92cTL94k6N0Yol30HgdWeCSdlVj3vgentULTwS-2Oxw33fywSp-Ndi3dkjvjg0ORxmHGN7Ry10g4hgA3VhEGAD_mB4Ypf-RA_IKPPhTh_8ZL9N' },
];

const MatchCard = ({ user }: { user: typeof users[0] }) => (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-border-light bg-surface-light shadow-card transition-all duration-300 hover:shadow-card-hover dark:border-border-dark dark:bg-card-dark">
        <div className="flex-grow p-6">
            <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <img className="h-16 w-16 rounded-full object-cover" src={user.avatar} alt={user.name} />
                    <div>
                        <h3 className="text-lg font-bold">{user.name}</h3>
                        <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">{user.location}</p>
                    </div>
                </div>
                <div className="relative group/button flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-secondary/10 transition-transform hover:scale-110 dark:bg-secondary/20">
                    <span className="text-sm font-bold text-secondary">{user.match}</span>
                </div>
            </div>
            <div className="mb-6">
                <p className="mb-2 text-sm font-semibold">Primary Skills:</p>
                <div className="flex flex-wrap gap-2">
                    {user.skills.map(skill => <span key={skill} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary dark:bg-primary/20 dark:text-primary-light">{skill}</span>)}
                </div>
            </div>
            <div className="flex items-center justify-between text-sm text-text-light-secondary dark:text-text-dark-secondary">
                <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-amber-500" fill="currentColor" />
                    <span className="font-semibold text-text-light-primary dark:text-text-dark-primary">{user.rating.toFixed(1)}</span>
                    <span>({user.reviews})</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    <span>{user.availability}</span>
                </div>
            </div>
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-border-light bg-background-light p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:border-border-dark dark:bg-background-dark">
            <button className="w-full rounded-lg border border-border-light bg-surface-light px-4 py-2.5 text-sm font-bold transition-colors hover:bg-gray-100 dark:border-border-dark dark:bg-card-dark dark:hover:bg-slate-600">View Profile</button>
            <button className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary/90">Send Request</button>
        </div>
    </div>
);



interface Filter {
    skill: string[];
    availability: string[];
    rating: number | null;
    location: string[];
}

const MatchDiscovery = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState<Filter>({
        skill: [],
        availability: [],
        rating: null,
        location: [],
    });
    const [showFilters, setShowFilters] = useState(false);

    const skillOptions = ['Python', 'Data Science', 'UX Design', 'Project Mgmt', 'Spanish', 'Creative Writing'];    const availabilityOptions = ['Weekdays', 'Weekends', 'Evenings', 'Flexible'];
    const locationOptions = ['London, UK', 'Berlin, DE', 'Madrid, ES', 'Tokyo, JP'];

    const handleFilterChange = (category: keyof Filter, value: string | number) => {
        setFilters(prev => {
            if (category === 'rating') {
                return { ...prev, [category]: value as number };
            }
            const currentValues = prev[category] as string[];
            return {
                ...prev,
                [category]: currentValues.includes(value as string)
                    ? currentValues.filter(v => v !== value)
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
        setSearchQuery('');
    };

    const filteredUsers = users.filter(user => {
        if (searchQuery) {
            const searchLower = searchQuery.toLowerCase();
            if (!user.name.toLowerCase().includes(searchLower) &&
                !user.skills.some(skill => skill.toLowerCase().includes(searchLower)) &&
                !user.location.toLowerCase().includes(searchLower)) {
                return false;
            }
        }

        if (filters.skill.length && !filters.skill.some(skill => user.skills.includes(skill))) {
            return false;
        }

        if (filters.availability.length && !filters.availability.includes(user.availability)) {
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
                    <h1 className="text-3xl font-black tracking-tighter lg:text-4xl">Discover Your Match</h1>
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
                        <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
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
                                    {skillOptions.map(skill => (
                                        <label key={skill} className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={filters.skill.includes(skill)}
                                                onChange={() => handleFilterChange('skill', skill)}
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
                                    {availabilityOptions.map(time => (
                                        <label key={time} className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={filters.availability.includes(time)}
                                                onChange={() => handleFilterChange('availability', time)}
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
                                    {[4, 4.5].map(rating => (
                                        <label key={rating} className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name="rating"
                                                checked={filters.rating === rating}
                                                onChange={() => handleFilterChange('rating', rating)}
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
                                    {locationOptions.map(location => (
                                        <label key={location} className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={filters.location.includes(location)}
                                                onChange={() => handleFilterChange('location', location)}
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
                {(filters.skill.length > 0 || filters.availability.length > 0 || filters.location.length > 0 || filters.rating) && (
                    <div className="flex flex-wrap items-center gap-2">
                        {filters.skill.map(skill => (
                            <button
                                key={skill}
                                onClick={() => handleFilterChange('skill', skill)}
                                className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/20 dark:bg-primary/20 dark:text-primary-light dark:hover:bg-primary/30"
                            >
                                {skill}
                                <X className="h-3 w-3" />
                            </button>
                        ))}
                        {filters.availability.map(time => (
                            <button
                                key={time}
                                onClick={() => handleFilterChange('availability', time)}
                                className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/20 dark:bg-primary/20 dark:text-primary-light dark:hover:bg-primary/30"
                            >
                                {time}
                                <X className="h-3 w-3" />
                            </button>
                        ))}
                        {filters.location.map(location => (
                            <button
                                key={location}
                                onClick={() => handleFilterChange('location', location)}
                                className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/20 dark:bg-primary/20 dark:text-primary-light dark:hover:bg-primary/30"
                            >
                                {location}
                                <X className="h-3 w-3" />
                            </button>
                        ))}
                        {filters.rating && (
                            <button
                                onClick={() => handleFilterChange('rating', 0)}
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
                        Showing <span className="font-bold text-text-light-primary dark:text-text-dark-primary">{filteredUsers.length}</span> potential matches
                    </p>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {filteredUsers.map((user, i) => <MatchCard key={i} user={user} />)}
                </div>

                {/* No Results Message */}
                {filteredUsers.length === 0 && (
                    <div className="mt-8 text-center">
                        <h3 className="text-xl font-bold">No matches found</h3>
                        <p className="mt-2 text-text-light-secondary dark:text-text-dark-secondary">Try adjusting your filters or search criteria</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MatchDiscovery;
