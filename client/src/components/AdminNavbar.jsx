import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AdminNavbar = ({ onOpenMobileMenu }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="flex min-h-16 items-center justify-between gap-3 border-b bg-white px-4 py-3 md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open admin navigation"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 lg:hidden"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold text-gray-900 sm:text-lg">
            Admin Dashboard
          </h1>

          <p className="hidden text-xs text-gray-500 sm:block">
            Manage your CustomTee store
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <span className="hidden max-w-32 truncate text-sm text-gray-600 sm:block">
          {user?.name}
        </span>

        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-red-700 sm:px-4 sm:text-sm"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default AdminNavbar;