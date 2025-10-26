import {
  Search,
  Bell,
  Menu,
  User,
  Settings,
  CreditCard,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useUnreadNotificationCount } from "../hooks/useNotifications";
import { useCreditBalance } from "../hooks/useCredits";
import NotificationDropdown from "./NotificationDropdown";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { user, logout } = useAuth();
  const { data: unreadCount } = useUnreadNotificationCount();
  const { data: creditBalance } = useCreditBalance();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsProfileOpen(false);
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscapeKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
  const navLinks = [
    { name: "Dashboard", path: "/" },
    { name: "Discover", path: "/discover" },
    { name: "My Skills", path: "/skills" },
    { name: "Messages", path: "/messages" },
    { name: "My Sessions", path: "/sessions" },
  ];

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-solid border-border-light bg-card-light/80 px-6 py-3 backdrop-blur-sm dark:border-border-dark dark:bg-card-dark/80 md:px-10">
      <div className="flex items-center gap-8">
        <NavLink to="/" className="flex items-center gap-3 text-primary">
          <div className="size-7">
            <svg
              fill="none"
              viewBox="0 0 48 48"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M24 45.8096C19.6865 45.8096 15.4698 44.5305 11.8832 42.134C8.29667 39.7376 5.50128 36.3314 3.85056 32.3462C2.19985 28.361 1.76794 23.9758 2.60947 19.7452C3.451 15.5145 5.52816 11.6284 8.57829 8.5783C11.6284 5.52817 15.5145 3.45101 19.7452 2.60948C23.9758 1.76795 28.361 2.19986 32.3462 3.85057C36.3314 5.50129 39.7376 8.29668 42.134 11.8833C44.5305 15.4698 45.8096 19.6865 45.8096 24L24 24L24 45.8096Z"
                fill="currentColor"
              ></path>
            </svg>
          </div>
          <h2 className="text-xl font-bold leading-tight tracking-[-0.015em] text-text-light-primary dark:text-text-dark-primary">
            SkillSync
          </h2>
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
                  ? "bg-primary text-white"
                  : "text-text-light-primary dark:text-text-dark-primary"
              }`
            }
          >
            {link.name}
          </NavLink>
        ))}
      </nav>

      <div className="flex flex-1 items-center justify-end gap-3">
        {/* Credit Balance Display */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary">
          <CreditCard className="h-4 w-4" />
          <span className="text-sm font-medium">
            {creditBalance?.balance ?? 0} credits
          </span>
        </div>

        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            aria-label="Notifications"
            aria-expanded={isNotificationsOpen}
            aria-haspopup="true"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border-light bg-card-light text-text-light-secondary transition-colors hover:bg-primary/10 hover:text-primary dark:border-border-dark dark:bg-card-dark dark:text-text-dark-secondary dark:hover:bg-primary/10 dark:hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <Bell className="h-6 w-6" />
            {unreadCount && unreadCount.count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-medium text-white">
                {unreadCount.count > 99 ? "99+" : unreadCount.count}
              </span>
            )}
          </button>

          <NotificationDropdown
            isOpen={isNotificationsOpen}
            onClose={() => setIsNotificationsOpen(false)}
          />
        </div>

        {/* User Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            aria-label="User menu"
            aria-expanded={isProfileOpen}
            aria-haspopup="true"
            className="flex items-center gap-2 rounded-full border border-border-light bg-card-light px-3 py-1.5 text-text-light-secondary transition-colors hover:bg-primary/10 hover:text-primary dark:border-border-dark dark:bg-card-dark dark:text-text-dark-secondary dark:hover:bg-primary/10 dark:hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={`${user.firstName} ${user.lastName}`}
                className="h-6 w-6 rounded-full object-cover"
              />
            ) : (
              <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
            )}
            <span className="hidden sm:block text-sm font-medium">
              {user?.firstName} {user?.lastName}
            </span>
            <ChevronDown className="h-4 w-4" />
          </button>

          {isProfileOpen && (
            <div
              role="menu"
              aria-label="User menu"
              className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-border-light bg-card-light p-1 shadow-lg dark:border-border-dark dark:bg-card-dark"
            >
              <div className="mb-2 border-b border-border-light p-3 dark:border-border-dark">
                <div className="text-sm font-semibold">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                  {user?.email}
                </div>
                <div className="text-xs text-primary mt-1">
                  {creditBalance?.balance ?? 0} credits
                </div>
              </div>
              <NavLink
                to={`/profile/${user?.id}`}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-primary/5"
                onClick={() => setIsProfileOpen(false)}
              >
                <User className="h-4 w-4" /> Profile
              </NavLink>
              <NavLink
                to="/credits"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-primary/5"
                onClick={() => setIsProfileOpen(false)}
              >
                <CreditCard className="h-4 w-4" /> Credits
              </NavLink>
              <NavLink
                to="/settings"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-primary/5"
                onClick={() => setIsProfileOpen(false)}
              >
                <Settings className="h-4 w-4" /> Settings
              </NavLink>
              <div className="my-1 border-t border-border-light dark:border-border-dark"></div>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-500 transition-colors hover:bg-red-500/5"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          )}
        </div>

        <button
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border-light bg-card-light text-text-light-secondary transition-colors hover:bg-primary/10 hover:text-primary dark:border-border-dark dark:bg-card-dark dark:text-text-dark-secondary dark:hover:bg-primary/10 dark:hover:text-primary md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {isMenuOpen && (
        <div className="absolute top-full left-0 w-full animate-slide-in-right border-t border-border-light bg-card-light dark:border-border-dark dark:bg-card-dark md:hidden">
          <nav className="flex flex-col p-4">
            {navLinks.map((link) => (
              <NavLink
                key={link.name}
                to={link.path}
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) =>
                  `rounded-md px-4 py-2 text-base font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-white"
                      : "text-text-light-primary dark:text-text-dark-primary hover:bg-primary/10"
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
