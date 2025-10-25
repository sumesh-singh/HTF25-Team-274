import { Search, Bell, Menu } from 'lucide-react';
import { useState } from 'react';
import { NavLink } from 'react-router-dom';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Dashboard', path: '/' },
    { name: 'Discover', path: '/discover' },
    { name: 'My Skills', path: '/skills' },
    { name: 'Messages', path: '/messages' },
    { name: 'My Sessions', path: '/sessions' },
  ];

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-solid border-border-light bg-card-light/80 px-6 py-3 backdrop-blur-sm dark:border-border-dark dark:bg-card-dark/80 md:px-10">
      <div className="flex items-center gap-8">
        <NavLink to="/" className="flex items-center gap-3 text-primary">
          <div className="size-7">
            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 45.8096C19.6865 45.8096 15.4698 44.5305 11.8832 42.134C8.29667 39.7376 5.50128 36.3314 3.85056 32.3462C2.19985 28.361 1.76794 23.9758 2.60947 19.7452C3.451 15.5145 5.52816 11.6284 8.57829 8.5783C11.6284 5.52817 15.5145 3.45101 19.7452 2.60948C23.9758 1.76795 28.361 2.19986 32.3462 3.85057C36.3314 5.50129 39.7376 8.29668 42.134 11.8833C44.5305 15.4698 45.8096 19.6865 45.8096 24L24 24L24 45.8096Z" fill="currentColor"></path>
            </svg>
          </div>
          <h2 className="text-xl font-bold leading-tight tracking-[-0.015em] text-text-light-primary dark:text-text-dark-primary">SkillSync</h2>
        </NavLink>
      </div>

      <nav className="hidden flex-1 items-center justify-center gap-2 md:flex">
        {navLinks.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            className={({ isActive }) =>
              `rounded-full px-4 py-2 text-sm font-medium leading-normal transition-colors hover:bg-primary/10 hover:text-primary dark:hover:text-primary ${
                isActive
                  ? 'bg-primary text-white'
                  : 'text-text-light-primary dark:text-text-dark-primary'
              }`
            }
          >
            {link.name}
          </NavLink>
        ))}
      </nav>

      <div className="flex flex-1 items-center justify-end gap-3">
        <div className="hidden lg:flex relative h-10 w-full max-w-64">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Search className="h-5 w-5 text-text-light-secondary dark:text-text-dark-secondary" />
          </div>
          <input
            className="h-full w-full rounded-full border border-border-light bg-card-light pl-11 pr-4 text-sm text-text-light-primary placeholder:text-text-light-secondary focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:border-border-dark dark:bg-card-dark dark:text-text-dark-primary dark:placeholder:text-text-dark-secondary"
            placeholder="Search"
            type="search"
          />
        </div>
        <NavLink to="/notifications" className="flex h-10 w-10 items-center justify-center rounded-full border border-border-light bg-card-light text-text-light-secondary transition-colors hover:bg-primary/10 hover:text-primary dark:border-border-dark dark:bg-card-dark dark:text-text-dark-secondary dark:hover:bg-primary/10 dark:hover:text-primary">
          <Bell className="h-6 w-6" />
        </NavLink>
        <NavLink to="/profile/me" className="h-10 w-10 rounded-full bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDJQoTWf2ywkvBOj1KI3D3xGYAHE6vh80rPjYDXNtzfZDYnFWAdjFL_N0SyTR8iXfwfYxI8k1e6kSvkc9rDvo9XZe0m-Y4wSrYGljDUC6vC16gfSskxPlebVL13N6CdQbV339-r56aM9CNMUBxvGirl_n-Aml5R6Y73lNAZBmrnUBvB0k4209Otc8Wy3TiETadFnP1GqQ3f-U3OP11x8RFddQa9ehWZhIjgi5ybjLm7ieSXe05Ik8UGoq1091fBuVC9hFjvdvKgTmpI')" }}></NavLink>
        <button
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border-light bg-card-light text-text-light-secondary transition-colors hover:bg-primary/10 hover:text-primary dark:border-border-dark dark:bg-card-dark dark:text-text-dark-secondary dark:hover:bg-primary/10 dark:hover:text-primary md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>
      
      {isMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-card-light dark:bg-card-dark border-t border-border-light dark:border-border-dark md:hidden">
          <nav className="flex flex-col p-4">
            {navLinks.map((link) => (
              <NavLink
                key={link.name}
                to={link.path}
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) =>
                  `rounded-md px-4 py-2 text-base font-medium transition-colors ${
                    isActive ? 'bg-primary text-white' : 'text-text-light-primary dark:text-text-dark-primary hover:bg-primary/10'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
