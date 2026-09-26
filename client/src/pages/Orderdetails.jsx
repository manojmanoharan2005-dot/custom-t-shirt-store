import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import Loader from "../components/Loader";
import { useNotification } from "../context/NotificationContext";
import orderService from "../services/orderService";

const OrderDetails = () => {
  const { id } = useParams();
  const { showNotification } = useNotification();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadOrder = async () => {
    try {
      setLoading(true);

      const response = await orderService.getOrderById(id);

      setOrder(response.order);
    } catch (error) {
      console.error("Failed to load order:", error);

      showNotification(
        error.response?.data?.message ||
          "Failed to load order.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  const statusSteps = [
    "PLACED",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
  ];

  const getCurrentStatusIndex = () => {
    if (!order) {
      return -1;
    }

    return statusSteps.indexOf(order.orderStatus);
  };

  const formatPrice = (amount) => {
    return Number(amount || 0).toLocaleString("en-IN");
  };

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getOrderItemImage = (item) => {
    if (!item) {
      return "";
    }

    if (
      item.image &&
      typeof item.image === "string" &&
      item.image.trim() !== ""
    ) {
      return item.image.trim();
    }

    const product = item.product;

    if (!product || typeof product !== "object") {
      return "";
    }

    const itemColor = item.color?.trim().toLowerCase();

    const selectedVariant = Array.isArray(product.variants)
      ? product.variants.find(
          (variant) =>
            variant?.color?.trim().toLowerCase() === itemColor
        )
      : null;

    return (
      selectedVariant?.image ||
      product.variants?.[0]?.image ||
      ""
    );
  };

  if (loading) {
    return <Loader text="Loading order..." />;
  }

  if (!order) {
    return (
      <div className="bg-white">
        <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8">
          <div className="border border-gray-200 bg-gray-50 p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900">
              Order not found
            </h2>

            <Link
              to="/orders"
              className="mt-5 inline-block bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
            >
              Back to Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentStatusIndex = getCurrentStatusIndex();

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="flex flex-col justify-between gap-5 border-b border-gray-200 pb-7 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm text-gray-500">
              Order Details
            </p>

            <h1 className="mt-2 break-all text-2xl font-semibold tracking-tight text-gray-900">
              #{order._id}
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>

          <Link
            to="/orders"
            className="w-fit border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            ← Back to Orders
          </Link>
        </div>

        {order.orderStatus === "CANCELLED" && (
          <div className="mt-6 border border-red-200 bg-red-50 p-5">
            <h2 className="font-semibold text-red-700">
              Order Cancelled
            </h2>

            <p className="mt-1 text-sm text-red-600">
              This order has been cancelled.
            </p>
          </div>
        )}

        {order.orderStatus !== "CANCELLED" && (
          <section className="mt-6 border border-gray-200 p-6">
            <div>
              <p className="text-sm text-gray-500">
                Status
              </p>

              <h2 className="mt-1 text-lg font-semibold text-gray-900">
                Order Tracking
              </h2>
            </div>

            <div className="mt-8 overflow-x-auto pb-2">
              <div className="flex min-w-162.5">
                {statusSteps.map((status, index) => {
                  const completed =
                    index <= currentStatusIndex;

                  const lineCompleted =
                    index < currentStatusIndex;

                  return (
                    <div
                      key={status}
                      className="relative flex-1 text-center"
                    >
                      {index < statusSteps.length - 1 && (
                        <div
                          className={`absolute left-1/2 top-4 h-px w-full ${
                            lineCompleted
                              ? "bg-black"
                              : "bg-gray-200"
                          }`}
                        />
                      )}

                      <div className="relative z-10 flex justify-center">
                        <div
                          className={`flex h-8 w-8 items-center justify-center border text-xs font-semibold ${
                            completed
                              ? "border-black bg-black text-white"
                              : "border-gray-300 bg-white text-gray-400"
                          }`}
                        >
                          {completed &&
                          index < currentStatusIndex
                            ? "✓"
                            : index + 1}
                        </div>
                      </div>

                      <p
                        className={`mt-3 text-xs font-medium ${
                          completed
                            ? "text-gray-900"
                            : "text-gray-400"
                        }`}
                      >
                        {status}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <section className="border border-gray-200 p-6">
              <div className="flex items-center justify-between border-b border-gray-200 pb-5">
                <div>
                  <p className="text-sm text-gray-500">
                    Products
                  </p>

                  <h2 className="mt-1 text-lg font-semibold text-gray-900">
                    Ordered Items
                  </h2>
                </div>

                <span className="text-sm text-gray-500">
                  {order.items?.length || 0} items
                </span>
              </div>

              <div className="divide-y divide-gray-200">
                {order.items?.map((item, index) => {
                  const product = item.product || {};

                  const image =
                    getOrderItemImage(item);

                  const itemTotal =
                    Number(item.price || 0) *
                    Number(item.quantity || 0);

                  return (
                    <div
                      key={
                        item._id ||
                        `${order._id}-${index}`
                      }
                      className="flex gap-4 py-5"
                    >
                      <div className="h-24 w-24 shrink-0 overflow-hidden bg-gray-100">
                        {image ? (
                          <img
                            src={image}
                            alt={
                              product.name ||
                              "Product"
                            }
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display =
                                "none";
                            }}
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-gray-400">
                            No image
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col justify-between gap-2 sm:flex-row">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {product.name ||
                                item.productName ||
                                "Product"}
                            </h3>

                            <p className="mt-1 text-sm text-gray-500">
                              ₹{formatPrice(item.price)} each
                            </p>
                          </div>

                          <p className="font-semibold text-gray-900">
                            ₹{formatPrice(itemTotal)}
                          </p>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                          {item.size && (
                            <span>
                              Size: {item.size}
                            </span>
                          )}

                          {item.color && (
                            <span>
                              Color: {item.color}
                            </span>
                          )}

                          <span>
                            Qty: {item.quantity}
                          </span>
                        </div>

                        {item.customization && (
                          <div className="mt-3 space-y-2 border-l-2 border-gray-300 pl-3">
                            <p className="text-xs font-medium text-gray-700">
                              Customized Item
                            </p>

                            {item.customization.text && (
                              <p className="text-xs text-gray-500">
                                Text:{" "}
                                <span className="font-medium text-gray-900">
                                  {item.customization.text}
                                </span>
                              </p>
                            )}

                            {item.customization.design && (
                              <div className="flex items-center gap-2">
                                {(item.customization.design.image ||
                                  item.customization.design.imageUrl) && (
                                  <img
                                    src={
                                      item.customization.design.image ||
                                      item.customization.design.imageUrl
                                    }
                                    alt={
                                      item.customization.design.name ||
                                      "Choosed Design"
                                    }
                                    className="h-10 w-10 border border-gray-200 bg-gray-50 object-contain"
                                  />
                                )}
                                <span className="text-xs text-gray-500">
                                  Admin Design:{" "}
                                  <span className="font-medium text-gray-900">
                                    {item.customization.design.name ||
                                      "Selected Design"}
                                  </span>
                                </span>
                              </div>
                            )}

                            {item.customization.imageUrl && (
                              <div className="flex items-center gap-2">
                                <img
                                  src={item.customization.imageUrl}
                                  alt="Uploaded Design"
                                  className="h-10 w-10 border border-gray-200 bg-gray-50 object-contain"
                                />
                                <span className="text-xs text-gray-500">
                                  User Uploaded Design
                                  {item.customization.originalFileName && (
                                    <span className="font-medium text-gray-900">
                                      {" "}
                                      ({item.customization.originalFileName})
                                    </span>
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="border border-gray-200 p-6">
              <p className="text-sm text-gray-500">
                Delivery
              </p>

              <h2 className="mt-1 text-lg font-semibold text-gray-900">
                Delivery Address
              </h2>

              {order.shippingAddress ? (
                <div className="mt-5 border-t border-gray-200 pt-5 text-sm leading-6 text-gray-600">
                  <p className="font-semibold text-gray-900">
                    {order.shippingAddress.fullName}
                  </p>

                  <p>
                    {order.shippingAddress.addressLine}
                  </p>

                  <p>
                    {order.shippingAddress.city},{" "}
                    {order.shippingAddress.state} -{" "}
                    {order.shippingAddress.pincode}
                  </p>

                  <p className="mt-2">
                    Phone:{" "}
                    {order.shippingAddress.phone}
                  </p>
                </div>
              ) : order.address ? (
                <div className="mt-5 border-t border-gray-200 pt-5 text-sm leading-6 text-gray-600">
                  <p className="font-semibold text-gray-900">
                    {order.address.fullName}
                  </p>

                  <p>
                    {order.address.addressLine}
                  </p>

                  <p>
                    {order.address.city},{" "}
                    {order.address.state} -{" "}
                    {order.address.pincode}
                  </p>

                  <p className="mt-2">
                    Phone: {order.address.phone}
                  </p>
                </div>
              ) : (
                <p className="mt-5 text-sm text-gray-500">
                  Address information unavailable.
                </p>
              )}
            </section>
          </div>

          <aside className="h-fit lg:sticky lg:top-6">
            <div className="border border-gray-200 p-6">
              <p className="text-sm text-gray-500">
                Payment
              </p>

              <h2 className="mt-1 text-lg font-semibold text-gray-900">
                Payment Summary
              </h2>

              <div className="mt-6 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    Subtotal
                  </span>

                  <span className="text-gray-900">
                    ₹{formatPrice(order.subtotal)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    Discount
                  </span>

                  <span className="text-green-600">
                    - ₹{formatPrice(order.discountAmount)}
                  </span>
                </div>

                {order.couponCode && (
                  <div className="flex justify-between gap-4 text-sm">
                    <span className="text-gray-500">
                      Coupon
                    </span>

                    <span className="font-medium text-gray-900">
                      {order.couponCode}
                    </span>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">
                      Total
                    </span>

                    <span className="text-xl font-semibold text-gray-900">
                      ₹{formatPrice(order.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-gray-200 pt-5">
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500">
                      Payment Method
                    </span>

                    <span className="text-right font-medium text-gray-900">
                      {order.paymentMethod}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500">
                      Payment Status
                    </span>

                    <span
                      className={`font-medium ${
                        order.paymentStatus === "PAID"
                          ? "text-green-600"
                          : order.paymentStatus === "FAILED"
                            ? "text-red-600"
                            : "text-yellow-600"
                      }`}
                    >
                      {order.paymentStatus}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500">
                      Order Status
                    </span>

                    <span className="text-right font-medium text-gray-900">
                      {order.orderStatus}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;