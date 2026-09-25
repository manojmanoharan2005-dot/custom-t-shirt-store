import { useEffect, useState } from "react";

import Loader from "../components/Loader";
import couponService from "../services/couponService";

const initialForm = {
  code: "",
  discountType: "PERCENTAGE",
  discountValue: "",
  minimumOrderAmount: "",
  maximumDiscount: "",
  usageLimit: "",
  expiryDate: "",
  isActive: true,
};

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);

  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadCoupons = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await couponService.getCoupons();

      setCoupons(response.coupons || []);
    } catch (error) {
      console.error(
        "Failed to load coupons:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to load coupons."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!form.code.trim()) {
        setError(
          "Coupon code is required."
        );
        return;
      }

      if (
        form.discountValue === "" ||
        Number(form.discountValue) <= 0
      ) {
        setError(
          "Discount value must be greater than 0."
        );
        return;
      }

      if (!form.expiryDate) {
        setError(
          "Expiry date is required."
        );
        return;
      }

      const couponData = {
        code: form.code
          .trim()
          .toUpperCase(),

        discountType:
          form.discountType,

        discountValue: Number(
          form.discountValue
        ),

        minimumOrderAmount:
          form.minimumOrderAmount === ""
            ? 0
            : Number(
                form.minimumOrderAmount
              ),

        maximumDiscount:
          form.maximumDiscount === ""
            ? undefined
            : Number(
                form.maximumDiscount
              ),

        usageLimit:
          form.usageLimit === ""
            ? undefined
            : Number(form.usageLimit),

        expiryDate:
          form.expiryDate,

        isActive: form.isActive,
      };

      if (editingId) {
        await couponService.updateCoupon(
          editingId,
          couponData
        );

        setMessage(
          "Coupon updated successfully."
        );
      } else {
        await couponService.createCoupon(
          couponData
        );

        setMessage(
          "Coupon created successfully."
        );
      }

      resetForm();

      await loadCoupons();
    } catch (error) {
      console.error(
        "Save coupon error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to save coupon."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (coupon) => {
    setEditingId(coupon._id);

    setForm({
      code: coupon.code || "",

      discountType:
        coupon.discountType ||
        "PERCENTAGE",

      discountValue:
        coupon.discountValue ?? "",

      minimumOrderAmount:
        coupon.minimumOrderAmount ?? "",

      maximumDiscount:
        coupon.maximumDiscount ?? "",

      usageLimit:
        coupon.usageLimit ?? "",

      expiryDate: coupon.expiryDate
        ? new Date(coupon.expiryDate)
            .toISOString()
            .slice(0, 16)
        : "",

      isActive:
        coupon.isActive ?? true,
    });

    setError("");
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (couponId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this coupon?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setMessage("");

      await couponService.deleteCoupon(
        couponId
      );

      setMessage(
        "Coupon deleted successfully."
      );

      await loadCoupons();
    } catch (error) {
      console.error(
        "Delete coupon error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to delete coupon."
      );
    }
  };

  if (loading) {
    return (
      <Loader text="Loading coupons..." />
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Coupons
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Create and manage discount coupons.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {message && (
        <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {message}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        <section className="h-fit rounded-xl border bg-white p-6">
          <h2 className="text-lg font-bold text-gray-900">
            {editingId
              ? "Edit Coupon"
              : "Add Coupon"}
          </h2>

          <form
            onSubmit={handleSubmit}
            className="mt-5 space-y-5"
          >
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Coupon Code
              </label>

              <input
                type="text"
                name="code"
                value={form.code}
                onChange={handleChange}
                required
                placeholder="SAVE20"
                className="w-full rounded-lg border px-4 py-3 uppercase outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Discount Type
              </label>

              <select
                name="discountType"
                value={form.discountType}
                onChange={handleChange}
                className="w-full rounded-lg border px-4 py-3 outline-none focus:border-black"
              >
                <option value="PERCENTAGE">
                  Percentage
                </option>

                <option value="FIXED">
                  Fixed Amount
                </option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Discount Value
              </label>

              <input
                type="number"
                name="discountValue"
                value={form.discountValue}
                onChange={handleChange}
                min="0"
                required
                placeholder={
                  form.discountType ===
                  "PERCENTAGE"
                    ? "20"
                    : "200"
                }
                className="w-full rounded-lg border px-4 py-3 outline-none focus:border-black"
              />

              <p className="mt-1 text-xs text-gray-500">
                {form.discountType ===
                "PERCENTAGE"
                  ? "Example: 20 means 20% discount."
                  : "Example: 200 means ₹200 discount."}
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Minimum Order Amount
              </label>

              <input
                type="number"
                name="minimumOrderAmount"
                value={
                  form.minimumOrderAmount
                }
                onChange={handleChange}
                min="0"
                placeholder="500"
                className="w-full rounded-lg border px-4 py-3 outline-none focus:border-black"
              />
            </div>

            {form.discountType ===
              "PERCENTAGE" && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Maximum Discount
                </label>

                <input
                  type="number"
                  name="maximumDiscount"
                  value={
                    form.maximumDiscount
                  }
                  onChange={handleChange}
                  min="0"
                  placeholder="500"
                  className="w-full rounded-lg border px-4 py-3 outline-none focus:border-black"
                />

                <p className="mt-1 text-xs text-gray-500">
                  Leave empty for no maximum
                  discount.
                </p>
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Usage Limit
              </label>

              <input
                type="number"
                name="usageLimit"
                value={form.usageLimit}
                onChange={handleChange}
                min="1"
                placeholder="100"
                className="w-full rounded-lg border px-4 py-3 outline-none focus:border-black"
              />

              <p className="mt-1 text-xs text-gray-500">
                Leave empty for unlimited usage.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Expiry Date
              </label>

              <input
                type="datetime-local"
                name="expiryDate"
                value={form.expiryDate}
                onChange={handleChange}
                required
                className="w-full rounded-lg border px-4 py-3 outline-none focus:border-black"
              />
            </div>

            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                name="isActive"
                checked={form.isActive}
                onChange={handleChange}
                className="h-4 w-4"
              />

              <span className="text-sm font-medium text-gray-700">
                Active Coupon
              </span>
            </label>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-lg bg-black px-5 py-3 font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update"
                    : "Create"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border px-5 py-3 font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="rounded-xl border bg-white lg:col-span-2">
          <div className="border-b p-5">
            <h2 className="font-bold text-gray-900">
              Coupon List
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {coupons.length} coupon
              {coupons.length !== 1
                ? "s"
                : ""}
            </p>
          </div>

          {coupons.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              No coupons found.
            </div>
          ) : (
            <div className="divide-y">
              {coupons.map((coupon) => (
                <div
                  key={coupon._id}
                  className="p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-lg bg-gray-900 px-3 py-1.5 font-mono text-sm font-bold text-white">
                          {coupon.code}
                        </span>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            coupon.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {coupon.isActive
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </div>

                      <p className="mt-3 text-lg font-bold text-gray-900">
                        {coupon.discountType ===
                        "PERCENTAGE"
                          ? `${coupon.discountValue}% OFF`
                          : `₹${coupon.discountValue} OFF`}
                      </p>

                      <div className="mt-2 space-y-1 text-sm text-gray-500">
                        <p>
                          Min order: ₹
                          {coupon.minimumOrderAmount ??
                            0}
                        </p>

                        {coupon.maximumDiscount !==
                          undefined &&
                          coupon.maximumDiscount !==
                            null && (
                            <p>
                              Max discount: ₹
                              {
                                coupon.maximumDiscount
                              }
                            </p>
                          )}

                        {coupon.usageLimit && (
                          <p>
                            Usage:{" "}
                            {coupon.usedCount ??
                              0}{" "}
                            /{" "}
                            {
                              coupon.usageLimit
                            }
                          </p>
                        )}

                        {coupon.expiryDate && (
                          <p>
                            Expires:{" "}
                            {new Date(
                              coupon.expiryDate
                            ).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() =>
                          handleEdit(coupon)
                        }
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(
                            coupon._id
                          )
                        }
                        className="text-sm font-medium text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminCoupons;