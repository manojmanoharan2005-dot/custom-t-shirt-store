import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Loader from "../components/Loader";
import orderService from "../services/orderService";
import { useNotification } from "../context/NotificationContext";

const Orders = () => {
  const { showNotification } =
    useNotification();

  const [orders, setOrders] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [cancellingId, setCancellingId] =
    useState(null);

  const [cancelModalOpen, setCancelModalOpen] =
    useState(false);

  const [selectedOrderId, setSelectedOrderId] =
    useState(null);

  const [cancelReason, setCancelReason] =
    useState("");

  const loadOrders = async () => {
    try {
      setLoading(true);

      const response =
        await orderService.getMyOrders();

      setOrders(
        response.orders || []
      );

    } catch (error) {
      console.error(
        "Failed to load orders:",
        error
      );

      showNotification(
        error.response?.data?.message ||
          "Failed to load orders.",
        "error"
      );

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleOpenCancelModal = (
    orderId
  ) => {
    setSelectedOrderId(orderId);
    setCancelReason("");
    setCancelModalOpen(true);
  };

  const handleCloseCancelModal = () => {
    if (cancellingId) {
      return;
    }

    setCancelModalOpen(false);
    setSelectedOrderId(null);
    setCancelReason("");
  };

  const handleCancelOrder = async () => {
    if (!selectedOrderId) {
      return;
    }

    const reason =
      cancelReason.trim();

    if (!reason) {
      showNotification(
        "Please enter a cancellation reason.",
        "error"
      );

      return;
    }

    if (reason.length < 5) {
      showNotification(
        "Cancellation reason must be at least 5 characters.",
        "error"
      );

      return;
    }

    try {
      setCancellingId(
        selectedOrderId
      );

      const response =
        await orderService.cancelOrder(
          selectedOrderId,
          {
            reason,
          }
        );

      showNotification(
        response?.message ||
          "Order cancelled successfully.",
        "success"
      );

      setCancelModalOpen(false);
      setSelectedOrderId(null);
      setCancelReason("");

      await loadOrders();

    } catch (error) {
      console.error(
        "Cancel order error:",
        error
      );

      showNotification(
        error.response?.data?.message ||
          "Failed to cancel order.",
        "error"
      );

    } finally {
      setCancellingId(null);
    }
  };

  const canCancel = (
    status
  ) => {
    return (
      status === "PLACED" ||
      status === "CONFIRMED"
    );
  };

  const getStatusClass = (
    status
  ) => {
    switch (status) {
      case "DELIVERED":
        return "border-green-200 bg-green-50 text-green-700";

      case "CANCELLED":
        return "border-red-200 bg-red-50 text-red-700";

      case "SHIPPED":
        return "border-blue-200 bg-blue-50 text-blue-700";

      case "PROCESSING":
        return "border-yellow-200 bg-yellow-50 text-yellow-700";

      case "CONFIRMED":
        return "border-purple-200 bg-purple-50 text-purple-700";

      default:
        return "border-gray-200 bg-gray-50 text-gray-700";
    }
  };

  const getPaymentStatusClass = (
    status
  ) => {
    switch (status) {
      case "PAID":
        return "text-green-600";

      case "FAILED":
        return "text-red-600";

      default:
        return "text-yellow-600";
    }
  };

  const formatPrice = (
    amount
  ) => {
    return Number(
      amount || 0
    ).toLocaleString(
      "en-IN"
    );
  };

  const formatDate = (
    date
  ) => {
    if (!date) {
      return "-";
    }

    return new Date(
      date
    ).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const getOrderItemImage = (
    item
  ) => {
    if (!item) {
      return "";
    }

    if (
      item.image &&
      typeof item.image ===
        "string" &&
      item.image.trim() !== ""
    ) {
      return item.image.trim();
    }

    const product =
      item.product;

    if (
      !product ||
      typeof product !==
        "object"
    ) {
      return "";
    }

    const itemColor =
      item.color
        ?.trim()
        .toLowerCase();

    const selectedVariant =
      Array.isArray(
        product.variants
      )
        ? product.variants.find(
            (variant) =>
              variant?.color
                ?.trim()
                .toLowerCase() ===
              itemColor
          )
        : null;

    return (
      selectedVariant?.image ||
      product.variants?.[0]
        ?.image ||
      product.images?.[0] ||
      ""
    );
  };

  if (loading) {
    return (
      <Loader text="Loading orders..." />
    );
  }

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">

        <div className="border-b border-gray-200 pb-7">
          <p className="text-sm text-gray-500">
            Account
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
            My Orders
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            View your orders and track their status.
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="py-20 text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center border border-gray-200 text-xl">
              📦
            </div>

            <h2 className="mt-5 text-xl font-semibold text-gray-900">
              No orders yet
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Your orders will appear here after you place one.
            </p>

            <Link
              to="/products"
              className="mt-6 inline-block bg-black px-6 py-3 text-sm font-medium text-white hover:bg-gray-800"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-5">

            {orders.map(
              (order) => {

                const itemCount =
                  order.items?.reduce(
                    (
                      total,
                      item
                    ) =>
                      total +
                      Number(
                        item.quantity ||
                          0
                      ),
                    0
                  ) || 0;

                const orderStatus =
                  order.orderStatus ||
                  "PLACED";

                const paymentStatus =
                  order.paymentStatus ||
                  "PENDING";

                return (
                  <article
                    key={
                      order._id
                    }
                    className="border border-gray-200 bg-white"
                  >

                    <div className="flex flex-col justify-between gap-4 border-b border-gray-200 p-5 sm:flex-row sm:items-center">

                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-400">
                          Order ID
                        </p>

                        <p className="mt-1 font-medium text-gray-900">
                          #
                          {order._id
                            ? order._id.slice(
                                -8
                              )
                            : "-"}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          {formatDate(
                            order.createdAt
                          )}
                        </p>
                      </div>

                      <span
                        className={`w-fit border px-3 py-1.5 text-xs font-medium ${getStatusClass(
                          orderStatus
                        )}`}
                      >
                        {orderStatus}
                      </span>
                    </div>

                    <div className="grid gap-5 border-b border-gray-200 px-5 py-5 sm:grid-cols-3">

                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-400">
                          Items
                        </p>

                        <p className="mt-1 text-sm font-medium text-gray-900">
                          {itemCount}{" "}
                          {itemCount ===
                          1
                            ? "item"
                            : "items"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-400">
                          Payment
                        </p>

                        <p className="mt-1 text-sm font-medium text-gray-900">
                          {order.paymentMethod ||
                            "COD"}
                        </p>

                        <p
                          className={`mt-1 text-xs font-medium ${getPaymentStatusClass(
                            paymentStatus
                          )}`}
                        >
                          {paymentStatus}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-400">
                          Total
                        </p>

                        <p className="mt-1 text-lg font-semibold text-gray-900">
                          ₹
                          {formatPrice(
                            order.totalAmount
                          )}
                        </p>
                      </div>
                    </div>

                    {order.orderStatus ===
                      "CANCELLED" &&
                      order.cancellationReason && (
                        <div className="border-b border-gray-200 bg-red-50 px-5 py-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-red-500">
                            Cancellation Reason
                          </p>

                          <p className="mt-1 text-sm text-red-700">
                            {
                              order.cancellationReason
                            }
                          </p>
                        </div>
                      )}

                    {order.items?.length >
                      0 && (
                      <div className="border-b border-gray-200 px-5 py-5">

                        <p className="mb-4 text-xs uppercase tracking-wide text-gray-400">
                          Order Items
                        </p>

                        <div className="space-y-4">

                          {order.items
                            .slice(
                              0,
                              3
                            )
                            .map(
                              (
                                item,
                                index
                              ) => {

                                const image =
                                  getOrderItemImage(
                                    item
                                  );

                                return (
                                  <div
                                    key={
                                      item._id ||
                                      `${order._id}-${index}`
                                    }
                                    className="flex items-center gap-4"
                                  >

                                    <div className="h-16 w-16 shrink-0 overflow-hidden bg-gray-100">

                                      {image ? (
                                        <img
                                          src={
                                            image
                                          }
                                          alt={
                                            item.product
                                              ?.name ||
                                            "Product"
                                          }
                                          className="h-full w-full object-cover"
                                          onError={(
                                            e
                                          ) => {
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

                                      <p className="truncate text-sm font-medium text-gray-900">
                                        {item.product
                                          ?.name ||
                                          item.productName ||
                                          "Product"}
                                      </p>

                                      <p className="mt-1 text-xs text-gray-500">
                                        Qty:{" "}
                                        {item.quantity ||
                                          1}

                                        {item.size &&
                                          ` · Size: ${item.size}`}

                                        {item.color &&
                                          ` · ${item.color}`}
                                      </p>
                                    </div>
                                  </div>
                                );
                              }
                            )}

                        </div>

                        {order.items.length >
                          3 && (
                          <p className="mt-4 text-xs text-gray-500">
                            +{" "}
                            {order.items.length -
                              3}{" "}
                            more{" "}
                            {order.items.length -
                              3 ===
                            1
                              ? "item"
                              : "items"}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3 px-5 py-5">

                      <Link
                        to={`/orders/${order._id}`}
                        className="bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
                      >
                        View Order
                      </Link>

                      {canCancel(
                        orderStatus
                      ) && (
                        <button
                          type="button"
                          disabled={
                            cancellingId ===
                            order._id
                          }
                          onClick={() =>
                            handleOpenCancelModal(
                              order._id
                            )
                          }
                          className="border border-red-300 px-5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {cancellingId ===
                          order._id
                            ? "Cancelling..."
                            : "Cancel Order"}
                        </button>
                      )}
                    </div>

                  </article>
                );
              }
            )}

          </div>
        )}
      </div>

      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">

          <div className="w-full max-w-md bg-white p-6 shadow-2xl">

            <div className="flex items-start justify-between gap-4">

              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Cancel Order
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Please tell us why you want to cancel this order.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  handleCloseCancelModal
                }
                disabled={
                  !!cancellingId
                }
                className="text-2xl leading-none text-gray-400 hover:text-gray-700 disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <div className="mt-5">

              <label
                htmlFor="cancelReason"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Cancellation reason
              </label>

              <textarea
                id="cancelReason"
                value={
                  cancelReason
                }
                onChange={(e) =>
                  setCancelReason(
                    e.target.value
                  )
                }
                placeholder="Example: I ordered the wrong size..."
                rows={4}
                maxLength={500}
                disabled={
                  !!cancellingId
                }
                className="w-full resize-none border border-gray-300 px-3 py-3 text-sm outline-none focus:border-black disabled:bg-gray-100"
              />

              <div className="mt-1 text-right text-xs text-gray-400">
                {
                  cancelReason.length
                }
                /500
              </div>
            </div>

            <div className="mt-6 flex gap-3">

              <button
                type="button"
                onClick={
                  handleCloseCancelModal
                }
                disabled={
                  !!cancellingId
                }
                className="flex-1 border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Keep Order
              </button>

              <button
                type="button"
                onClick={
                  handleCancelOrder
                }
                disabled={
                  !!cancellingId ||
                  !cancelReason.trim()
                }
                className="flex-1 bg-red-600 px-4 py-3 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cancellingId
                  ? "Cancelling..."
                  : "Confirm Cancellation"}
              </button>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;