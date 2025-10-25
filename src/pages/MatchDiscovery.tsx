import React from 'react';
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

const FilterSidebar = () => (
    <div className="sticky top-24">
        <div className="flex flex-col gap-6 rounded-xl border border-border-light bg-surface-light p-6 transition-all duration-300 dark:border-border-dark dark:bg-card-dark">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Filters</h3>
                <button className="text-sm font-medium text-primary hover:underline">Reset All</button>
            </div>
            {/* ... More filter sections ... */}
        </div>
    </div>
);


const MatchDiscovery = () => {
    return (
        <div>
            <div className="mb-8 flex flex-wrap items-start justify-between gap-6">
                <div className="flex min-w-72 flex-col gap-1">
                    <h1 className="text-3xl font-black tracking-tighter lg:text-4xl">Discover Your Match</h1>
                    <p className="text-base font-normal text-text-light-secondary dark:text-dark-secondary">Find the perfect partner to learn and grow with.</p>
                </div>
            </div>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                <aside className="lg:col-span-3">
                    <FilterSidebar />
                </aside>
                <section className="lg:col-span-9">
                    <div className="mb-4">
                        <p className="text-sm text-text-light-secondary dark:text-dark-secondary">Showing <span className="font-bold text-text-light-primary dark:text-dark-primary">{users.length}</span> potential matches</p>
                    </div>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {users.map((user, i) => <MatchCard key={i} user={user} />)}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default MatchDiscovery;
