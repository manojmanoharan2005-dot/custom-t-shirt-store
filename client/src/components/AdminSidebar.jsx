import { NavLink } from "react-router-dom";

const AdminSidebar = ({
  isMobileMenuOpen,
  onCloseMobileMenu,
}) => {
  const menuItems = [
    {
      label: "Dashboard",
      path: "/admin",
    },
    {
      label: "Products",
      path: "/admin/products",
    },
    {
      label: "Categories",
      path: "/admin/categories",
    },
    {
      label: "Designs",
      path: "/admin/designs",
    },
    {
      label: "Banners",
      path: "/admin/banners",
    },
    {
      label: "Coupons",
      path: "/admin/coupons",
    },
    {
      label: "Orders",
      path: "/admin/orders",
    },
    {
      label: "Customers",
      path: "/admin/customers",
    },
  ];

  const handleNavigation = () => {
    onCloseMobileMenu();
  };

  return (
    <>
      <aside className="hidden min-h-screen w-64 shrink-0 border-r bg-white lg:flex lg:flex-col">
        <div className="border-b px-6 py-5">
          <h2 className="text-xl font-bold text-gray-900">
            Admin Panel
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            CustomTee
          </p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/admin"}
              className={({ isActive }) =>
                `block rounded-lg px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-black text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {isMobileMenuOpen && (
        <button
          type="button"
          aria-label="Close admin navigation"
          onClick={onCloseMobileMenu}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-white shadow-xl transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b px-5 py-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Admin Panel
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              CustomTee
            </p>
          </div>

          <button
            type="button"
            onClick={onCloseMobileMenu}
            aria-label="Close admin navigation"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-100"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/admin"}
              onClick={handleNavigation}
              className={({ isActive }) =>
                `block rounded-lg px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-black text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default AdminSidebar;