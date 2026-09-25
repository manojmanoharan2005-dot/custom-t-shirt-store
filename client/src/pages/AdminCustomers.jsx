import { useEffect, useState } from "react";

import Loader from "../components/Loader";
import adminService from "../services/adminService";
import { useNotification } from "../context/NotificationContext";

const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { showNotification } = useNotification();

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await adminService.getCustomers();

      setCustomers(response.customers || []);
    } catch (error) {
      console.error(
        "Failed to load customers:",
        error
      );

      const message =
        error.response?.data?.message ||
        "Failed to load customers.";

      setError(message);

      showNotification(message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleDeleteCustomer = async (
    customer
  ) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${customer.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await adminService.deleteCustomer(
        customer._id
      );

      setCustomers((prevCustomers) =>
        prevCustomers.filter(
          (item) => item._id !== customer._id
        )
      );

      showNotification(
        "Customer deleted successfully.",
        "success"
      );
    } catch (error) {
      console.error(
        "Failed to delete customer:",
        error
      );

      const message =
        error.response?.data?.message ||
        "Failed to delete customer.";

      setError(message);

      showNotification(message, "error");
    }
  };

  if (loading) {
    return (
      <Loader text="Loading customers..." />
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Customers
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          View registered customers and their
          details.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="mb-6 rounded-xl border bg-white p-5">
        <p className="text-sm text-gray-500">
          Total Customers
        </p>

        <p className="mt-2 text-2xl font-bold text-gray-900">
          {customers.length}
        </p>
      </div>

      <section className="rounded-xl border bg-white shadow-sm">

        <div className="border-b p-5">
          <h2 className="font-bold text-gray-900">
            Customer List
          </h2>
        </div>

        {customers.length === 0 ? (

          <div className="p-10 text-center text-gray-500">
            No customers found.
          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full min-w-250 text-left text-sm">

              <thead className="bg-gray-50 text-gray-600">

                <tr>

                  <th className="px-5 py-3 font-medium">
                    Customer
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Email
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Phone
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Addresses
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Joined
                  </th>

                  <th className="px-5 py-3 text-center font-medium">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y">

                {customers.map((customer) => (

                  <tr key={customer._id}>

                    <td className="px-5 py-4">

                      <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 font-semibold text-gray-700">
                          {customer.name
                            ?.charAt(0)
                            ?.toUpperCase() || "U"}
                        </div>

                        <div>

                          <p className="font-semibold text-gray-900">
                            {customer.name ||
                              "Unknown"}
                          </p>

                        </div>

                      </div>

                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {customer.email || "-"}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {customer.phone || "-"}
                    </td>

                    <td className="px-5 py-4">

                      <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                        {customer.addresses?.length ||
                          0}
                      </span>

                    </td>

                    <td className="px-5 py-4 text-gray-500">
                      {customer.createdAt
                        ? new Date(
                            customer.createdAt
                          ).toLocaleDateString()
                        : "-"}
                    </td>

                    <td className="px-5 py-4 text-center">

                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteCustomer(
                            customer
                          )
                        }
                        className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                      >
                        Delete
                      </button>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </section>
    </div>
  );
};

export default AdminCustomers;