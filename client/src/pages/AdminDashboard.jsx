import { useEffect, useState } from "react";

import Loader from "../components/Loader";
import adminService from "../services/adminService";

const AdminDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await adminService.getDashboard();

      setDashboard(response.dashboard || response);
    } catch (error) {
      console.error("Failed to load dashboard:", error);

      setError(
        error.response?.data?.message ||
          "Failed to load dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return <Loader text="Loading dashboard..." />;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-600">
        {error}
      </div>
    );
  }

  const stats = [
    {
      title: "Total Products",
      value: dashboard?.totalProducts ?? 0,
    },
    {
      title: "Total Customers",
      value: dashboard?.totalCustomers ?? 0,
    },
    {
      title: "Total Orders",
      value: dashboard?.totalOrders ?? 0,
    },
    {
      title: "Total Revenue",
      value: `₹${dashboard?.totalRevenue ?? 0}`,
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Dashboard
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Overview of your CustomTee store.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="rounded-xl border bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-gray-500">
              {stat.title}
            </p>

            <p className="mt-2 text-2xl font-bold text-gray-900">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border bg-white shadow-sm">
        <div className="border-b p-5">
          <h2 className="text-lg font-bold text-gray-900">
            Recent Orders
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Latest orders placed in your store.
          </p>
        </div>

        {dashboard?.recentOrders?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-5 py-3 font-medium">
                    Order
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Customer
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Amount
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {dashboard.recentOrders.map((order) => (
                  <tr key={order._id}>
                    <td className="px-5 py-4 font-medium">
                      #{order._id.slice(-8)}
                    </td>

                    <td className="px-5 py-4">
                      {order.user?.name ||
                        order.customerName ||
                        "Customer"}
                    </td>

                    <td className="px-5 py-4">
                      ₹{order.totalAmount || 0}
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium">
                        {order.orderStatus || "PLACED"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-gray-500">
            No recent orders available.
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <div className="rounded-xl border bg-white p-6">
          <h2 className="font-bold text-gray-900">
            Store Status
          </h2>

          <div className="mt-5 space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">
                Active Products
              </span>

              <span className="font-medium">
                {dashboard?.activeProducts ??
                  dashboard?.totalProducts ??
                  0}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">
                Pending Orders
              </span>

              <span className="font-medium">
                {dashboard?.pendingOrders ?? 0}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">
                Low Stock Products
              </span>

              <span className="font-medium">
                {dashboard?.lowStockProducts ?? 0}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6">
          <h2 className="font-bold text-gray-900">
            Quick Actions
          </h2>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <a
              href="/admin/products"
              className="rounded-lg border px-4 py-3 text-center text-sm font-medium hover:bg-gray-50"
            >
              Manage Products
            </a>

            <a
              href="/admin/orders"
              className="rounded-lg border px-4 py-3 text-center text-sm font-medium hover:bg-gray-50"
            >
              Manage Orders
            </a>

            <a
              href="/admin/customers"
              className="rounded-lg border px-4 py-3 text-center text-sm font-medium hover:bg-gray-50"
            >
              View Customers
            </a>

            <a
              href="/admin/coupons"
              className="rounded-lg border px-4 py-3 text-center text-sm font-medium hover:bg-gray-50"
            >
              Manage Coupons
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;