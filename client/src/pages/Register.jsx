import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { showNotification } = useNotification();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "phone") {
      const numbersOnly = value.replace(/\D/g, "");

      setFormData((current) => ({
        ...current,
        phone: numbersOnly.slice(0, 10),
      }));

      return;
    }

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();
    const phone = formData.phone.trim();

    if (
      !name ||
      !email ||
      !phone ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      showNotification(
        "Please fill all required fields.",
        "error"
      );
      return;
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      showNotification(
        "Please enter a valid email address.",
        "error"
      );
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      showNotification(
        "Phone number must contain exactly 10 digits.",
        "error"
      );
      return;
    }

    if (formData.password.length < 6) {
      showNotification(
        "Password must be at least 6 characters.",
        "error"
      );
      return;
    }

    if (
      formData.password !==
      formData.confirmPassword
    ) {
      showNotification(
        "Passwords do not match.",
        "error"
      );
      return;
    }

    try {
      setLoading(true);

      await register({
        name,
        email,
        phone,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      showNotification(
        "Registration successful. Redirecting to login...",
        "success"
      );

      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (error) {
      console.error("Registration error:", error);

      showNotification(
        error.response?.data?.message ||
          "Registration failed. Please try again.",
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
              Create Account
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Create an account to start customizing T-shirts.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-4"
          >
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Full Name
              </label>

              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your name"
                required
                autoComplete="name"
                className="h-11 w-full border border-gray-300 px-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Email
              </label>

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="h-11 w-full border border-gray-300 px-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Phone
              </label>

              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="10 digit phone number"
                required
                maxLength={10}
                inputMode="numeric"
                autoComplete="tel"
                className="h-11 w-full border border-gray-300 px-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-black"
              />

              <p className="mt-1 text-xs text-gray-500">
                Enter exactly 10 digits.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 6 characters"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="h-11 w-full border border-gray-300 px-3 pr-16 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-black"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (current) => !current
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500 hover:text-black"
                >
                  {showPassword ? "Hide" : "View"}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Confirm Password
              </label>

              <div className="relative">
                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className={`h-11 w-full border px-3 pr-16 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-black ${
                    formData.confirmPassword &&
                    formData.password !==
                      formData.confirmPassword
                      ? "border-red-400"
                      : "border-gray-300"
                  }`}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      (current) => !current
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500 hover:text-black"
                >
                  {showConfirmPassword
                    ? "Hide"
                    : "View"}
                </button>
              </div>

              {formData.confirmPassword && (
                <p
                  className={`mt-1 text-xs ${
                    formData.password ===
                    formData.confirmPassword
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {formData.password ===
                  formData.confirmPassword
                    ? "Passwords match."
                    : "Passwords do not match."}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 h-11 w-full bg-black px-6 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {loading
                ? "Creating Account..."
                : "Create Account"}
            </button>
          </form>

          <div className="mt-6 border-t border-gray-200 pt-6 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{" "}

              <Link
                to="/login"
                className="font-medium text-black hover:underline"
              >
                Login
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

export default Register;