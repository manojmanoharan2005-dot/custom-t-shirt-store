import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.webp";

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate("/login");
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const getLinkClass = (path) => {
    if (isActive(path)) {
      return "text-white";
    }

    return "text-white/55 hover:text-white";
  };

  return (
    <header className="border-b border-white/10 bg-black text-white">
      <div
        className="
          mx-auto
          flex
          h-16
          max-w-350
          items-center
          justify-between
          px-4
          sm:px-6
          lg:px-8
        "
      >
        <Link
          to="/"
          onClick={() => setMenuOpen(false)}
          className="flex shrink-0 items-center"
        >
          <img
            src={logo}
            alt="CustomTee"
            width={210}
            height={76}
            className="
              h-12
              w-auto
              object-contain
              sm:h-16
              lg:h-19
            "
          />
        </Link>

        <nav className="hidden items-center gap-9 md:flex">
          <Link
            to="/"
            className={`text-sm transition ${getLinkClass("/")}`}
          >
            Home
          </Link>

          <Link
            to="/products"
            className={`text-sm transition ${getLinkClass(
              "/products"
            )}`}
          >
            Shop
          </Link>

          {isAuthenticated && (
            <>
              <Link
                to="/orders"
                className={`text-sm transition ${getLinkClass(
                  "/orders"
                )}`}
              >
                Orders
              </Link>

              <Link
                to="/profile"
                className={`text-sm transition ${getLinkClass(
                  "/profile"
                )}`}
              >
                Profile
              </Link>
            </>
          )}
        </nav>

        <div className="hidden items-center justify-end gap-5 md:flex">
          {isAuthenticated && (
            <Link
              to="/cart"
              className="text-sm text-white/55 transition hover:text-white"
            >
              Cart
            </Link>
          )}

          {!isAuthenticated ? (
            <>
              <Link
                to="/login"
                className="text-sm text-white/55 transition hover:text-white"
              >
                Login
              </Link>

              <Link
                to="/register"
                className="border border-white/30 px-4 py-2 text-sm text-white transition hover:border-white"
              >
                Register
              </Link>
            </>
          ) : (
            <>
              <span className="max-w-28 truncate text-sm text-white/50">
                {user?.name}
              </span>

              {isAdmin && (
                <Link
                  to="/admin"
                  className="text-sm text-white/55 transition hover:text-white"
                >
                  Admin
                </Link>
              )}

              <button
                type="button"
                onClick={handleLogout}
                className="border border-white/30 px-4 py-2 text-sm text-white transition hover:border-white"
              >
                Logout
              </button>
            </>
          )}
        </div>

        <div className="flex shrink-0 justify-end md:hidden">
          <button
            type="button"
            onClick={() =>
              setMenuOpen((value) => !value)
            }
            className="
              border
              border-white/25
              p-2
              text-white
              transition
              hover:border-white
            "
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  strokeLinecap="round"
                  d="M6 6l12 12M18 6L6 18"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  strokeLinecap="round"
                  d="M4 7h16M4 12h16M4 17h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-white/10 bg-black md:hidden">
          <nav className="mx-auto max-w-375 px-4 sm:px-6">
            <Link
              to="/"
              onClick={() => setMenuOpen(false)}
              className={`block border-b border-white/10 py-4 text-sm ${getLinkClass(
                "/"
              )}`}
            >
              Home
            </Link>

            <Link
              to="/products"
              onClick={() => setMenuOpen(false)}
              className={`block border-b border-white/10 py-4 text-sm ${getLinkClass(
                "/products"
              )}`}
            >
              Shop
            </Link>

            {isAuthenticated && (
              <>
                <Link
                  to="/orders"
                  onClick={() => setMenuOpen(false)}
                  className={`block border-b border-white/10 py-4 text-sm ${getLinkClass(
                    "/orders"
                  )}`}
                >
                  Orders
                </Link>

                <Link
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                  className={`block border-b border-white/10 py-4 text-sm ${getLinkClass(
                    "/profile"
                  )}`}
                >
                  Profile
                </Link>

                <Link
                  to="/cart"
                  onClick={() => setMenuOpen(false)}
                  className="block border-b border-white/10 py-4 text-sm text-white/55 transition hover:text-white"
                >
                  Cart
                </Link>

                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="block border-b border-white/10 py-4 text-sm text-white/55 transition hover:text-white"
                  >
                    Admin
                  </Link>
                )}

                <div className="flex items-center justify-between py-4">
                  <span className="max-w-40 truncate text-sm text-white/50">
                    {user?.name}
                  </span>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="border border-white/25 px-4 py-2 text-sm text-white transition hover:border-white"
                  >
                    Logout
                  </button>
                </div>
              </>
            )}

            {!isAuthenticated && (
              <div className="flex gap-3 py-4">
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex-1 border border-white/25 px-4 py-3 text-center text-sm text-white"
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="flex-1 bg-white px-4 py-3 text-center text-sm font-medium text-black"
                >
                  Register
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;