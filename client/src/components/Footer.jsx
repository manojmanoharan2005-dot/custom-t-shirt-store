import { memo } from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="mt-16 border-t border-gray-200 bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-5 py-10 sm:grid-cols-2 lg:grid-cols-3 lg:px-8">

        <div>
          <Link
            to="/"
            className="text-lg font-semibold tracking-tight text-black"
          >
            CustomTee
          </Link>

          <p className="mt-3 max-w-sm text-sm leading-6 text-gray-500">
            Create and customize T-shirts that fit your style.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Quick Links
          </h3>

          <nav className="mt-4 flex flex-col gap-2.5 text-sm text-gray-500">
            <Link
              to="/"
              className="w-fit transition-colors hover:text-black"
            >
              Home
            </Link>

            <Link
              to="/products"
              className="w-fit transition-colors hover:text-black"
            >
              Shop
            </Link>

            <Link
              to="/cart"
              className="w-fit transition-colors hover:text-black"
            >
              Cart
            </Link>

            <Link
              to="/orders"
              className="w-fit transition-colors hover:text-black"
            >
              My Orders
            </Link>
          </nav>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Contact
          </h3>

          <div className="mt-4 space-y-2.5 text-sm text-gray-500">
            <p>
              admin@gmail.com
            </p>

            <p>
              +91 98765 43210
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200">
        <div className="mx-auto max-w-7xl px-5 py-4 text-center text-xs text-gray-400 lg:px-8">
          © {new Date().getFullYear()} CustomTee. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default memo(Footer);