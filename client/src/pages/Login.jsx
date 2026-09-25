import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { login } = useAuth();
  const { showNotification } = useNotification();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      showNotification(
        "Please enter your email and password.",
        "error"
      );
      return;
    }

    try {
      setLoading(true);

      const response = await login(trimmedEmail, password);

      showNotification("Login successful.", "success");

      const from = location.state?.from;

      const selectedSize = location.state?.selectedSize || "";
      const selectedColor = location.state?.selectedColor || "";
      const quantity = location.state?.quantity || 1;

      if (response.user?.role === "admin") {
        navigate("/admin", { replace: true });
        return;
      }

      if (typeof from === "string") {
        navigate(from, {
          replace: true,
          state: {
            selectedSize,
            selectedColor,
            quantity,
            restoreSelection: true,
          },
        });

        return;
      }

      if (from?.pathname) {
        const path = `${from.pathname}${from.search || ""}${
          from.hash || ""
        }`;

        navigate(path, {
          replace: true,
          state: {
            selectedSize,
            selectedColor,
            quantity,
            restoreSelection: true,
          },
        });

        return;
      }

      navigate("/", { replace: true });
    } catch (error) {
      console.error("Login error:", error);

      showNotification(
        error.response?.data?.message ||
          "Invalid email or password.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-white px-5 py-12">
      <div className="w-full max-w-md">
        <div className="border border-gray-200 bg-white p-6 sm:p-8">
          <div className="border-b border-gray-200 pb-6 text-center">
            <Link
              to="/"
              className="text-xl font-semibold tracking-tight text-black"
            >
              CustomTee
            </Link>

            <h1 className="mt-6 text-2xl font-semibold tracking-tight text-gray-900">
              Welcome Back
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Login to continue shopping.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-5"
          >
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="h-11 w-full border border-gray-300 px-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className="h-11 w-full border border-gray-300 px-3 pr-16 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-black"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((current) => !current)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500 hover:text-black"
                >
                  {showPassword ? "Hide" : "View"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-11 w-full bg-black px-6 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="mt-6 border-t border-gray-200 pt-6 text-center">
            <p className="text-sm text-gray-500">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-medium text-black hover:underline"
              >
                Create Account
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-5 text-center">
          <Link
            to="/"
            className="text-sm text-gray-500 hover:text-black"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
};

export default Login;