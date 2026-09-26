import { useEffect, useState } from "react";

import Loader from "../components/Loader";
import adminService from "../services/adminService";

const orderStatuses = [
  "PLACED",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

const nextStatusMap = {
  PLACED: "CONFIRMED",
  CONFIRMED: "PROCESSING",
  PROCESSING: "SHIPPED",
  SHIPPED: "DELIVERED",
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const [openStatusDropdownId, setOpenStatusDropdownId] =
    useState(null);

  const [selectedOrder, setSelectedOrder] = useState(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [showCancellationModal, setShowCancellationModal] =
    useState(false);

  const [cancellationOrderId, setCancellationOrderId] =
    useState(null);

  const [cancellationReason, setCancellationReason] =
    useState("");

  const [cancellationError, setCancellationError] =
    useState("");

  const [previewImageModal, setPreviewImageModal] = useState(null);
  const [previewTShirtModal, setPreviewTShirtModal] = useState(null);

  const handleDownloadImage = async (url, fileName) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName || "uploaded-design.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Failed to download image:", error);
      window.open(url, "_blank");
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await adminService.getAllOrders();

      setOrders(response.orders || []);

      return response.orders || [];
    } catch (error) {
      console.error(
        "Failed to load admin orders:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to load orders."
      );

      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    if (!openStatusDropdownId) {
      return;
    }

    const handleOutsideClick = (event) => {
      if (!event.target.closest("[data-status-dropdown]")) {
        setOpenStatusDropdownId(null);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, [openStatusDropdownId]);

  const isStatusOptionDisabled = (
    currentStatus,
    targetStatus
  ) => {
    if (currentStatus === "CANCELLED") {
      return targetStatus !== "CANCELLED";
    }

    if (targetStatus === "CANCELLED") {
      return false;
    }

    if (currentStatus === targetStatus) {
      return false;
    }

    return (
      nextStatusMap[currentStatus] !== targetStatus
    );
  };

  const isValidStatusChange = (
    currentStatus,
    targetStatus
  ) => {
    if (currentStatus === targetStatus) {
      return true;
    }

    if (targetStatus === "CANCELLED") {
      return currentStatus !== "CANCELLED";
    }

    if (currentStatus === "CANCELLED") {
      return false;
    }

    return (
      nextStatusMap[currentStatus] === targetStatus
    );
  };

  const openCancellationModal = (orderId) => {
    setCancellationOrderId(orderId);
    setCancellationReason("");
    setCancellationError("");
    setError("");
    setMessage("");
    setShowCancellationModal(true);
  };

  const closeCancellationModal = () => {
    setShowCancellationModal(false);
    setCancellationOrderId(null);
    setCancellationReason("");
    setCancellationError("");
  };

  const handleConfirmCancellation = async () => {
    const reason = cancellationReason.trim();

    if (!reason) {
      setCancellationError(
        "Cancellation reason is required."
      );
      return;
    }

    if (reason.length < 5) {
      setCancellationError(
        "Cancellation reason must be at least 5 characters."
      );
      return;
    }

    if (reason.length > 500) {
      setCancellationError(
        "Cancellation reason cannot exceed 500 characters."
      );
      return;
    }

    try {
      setUpdatingId(cancellationOrderId);
      setCancellationError("");
      setError("");
      setMessage("");

      await adminService.updateOrderStatus(
        cancellationOrderId,
        {
          orderStatus: "CANCELLED",
          cancellationReason: reason,
        }
      );

      closeCancellationModal();

      setMessage(
        "Order cancelled successfully."
      );

      const updatedOrders = await loadOrders();

      if (
        selectedOrder?._id ===
        cancellationOrderId
      ) {
        const updatedOrder =
          updatedOrders.find(
            (order) =>
              order._id ===
              cancellationOrderId
          );

        if (updatedOrder) {
          setSelectedOrder(updatedOrder);
        } else {
          setSelectedOrder((previous) => {
            if (!previous) {
              return null;
            }

            return {
              ...previous,
              orderStatus: "CANCELLED",
              cancellationReason: reason,
            };
          });
        }
      }
    } catch (error) {
      console.error(
        "Admin cancellation error:",
        error
      );

      setCancellationError(
        error.response?.data?.message ||
          "Failed to cancel order."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStatusChange = async (
    orderId,
    nextStatus
  ) => {
    const currentOrder = orders.find(
      (order) => order._id === orderId
    );

    if (!currentOrder) {
      return;
    }

    const currentStatus =
      currentOrder.orderStatus || "PLACED";

    if (currentStatus === nextStatus) {
      return;
    }

    setOpenStatusDropdownId(null);

    if (nextStatus === "CANCELLED") {
      openCancellationModal(orderId);
      return;
    }

    if (
      !isValidStatusChange(
        currentStatus,
        nextStatus
      )
    ) {
      setError(
        `Order cannot move from ${currentStatus} to ${nextStatus}.`
      );

      return;
    }

    try {
      setUpdatingId(orderId);
      setError("");
      setMessage("");

      await adminService.updateOrderStatus(
        orderId,
        {
          orderStatus: nextStatus,
        }
      );

      setMessage(
        `Order status updated to ${nextStatus}.`
      );

      const updatedOrders =
        await loadOrders();

      if (
        selectedOrder?._id === orderId
      ) {
        const updatedOrder =
          updatedOrders.find(
            (order) =>
              order._id === orderId
          );

        if (updatedOrder) {
          setSelectedOrder(updatedOrder);
        } else {
          setSelectedOrder((previous) => {
            if (!previous) {
              return null;
            }

            return {
              ...previous,
              orderStatus: nextStatus,
            };
          });
        }
      }
    } catch (error) {
      console.error(
        "Update order status error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to update order status."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "DELIVERED":
        return "bg-green-100 text-green-700";

      case "CANCELLED":
        return "bg-red-100 text-red-700";

      case "SHIPPED":
        return "bg-blue-100 text-blue-700";

      case "PROCESSING":
        return "bg-yellow-100 text-yellow-700";

      case "CONFIRMED":
        return "bg-purple-100 text-purple-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleString(
      "en-IN",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  };

  const getCustomerName = (order) => {
    return (
      order?.user?.name ||
      order?.customer?.name ||
      order?.shippingAddress?.fullName ||
      "Customer"
    );
  };

  const getCustomerEmail = (order) => {
    return (
      order?.user?.email ||
      order?.customer?.email ||
      "-"
    );
  };

  const getProductImage = (item) => {
    if (!item) {
      return "";
    }

    if (
      item.image &&
      typeof item.image === "string" &&
      item.image.trim()
    ) {
      return item.image.trim();
    }

    const product = item.product;

    if (
      !product ||
      typeof product !== "object"
    ) {
      return "";
    }

    const selectedColor =
      item.color
        ?.trim()
        .toLowerCase();

    const selectedVariant =
      Array.isArray(product.variants)
        ? product.variants.find(
            (variant) =>
              variant?.color
                ?.trim()
                .toLowerCase() ===
              selectedColor
          )
        : null;

    return (
      selectedVariant?.image ||
      product?.variants?.[0]?.image ||
      product?.images?.[0] ||
      ""
    );
  };

  const getCustomization = (item) => {
    if (!item) {
      return null;
    }

    const customization =
      item.customization;

    if (
      !customization ||
      typeof customization !== "object"
    ) {
      return null;
    }

    return customization;
  };

  const isCustomized = (item) => {
    const customization =
      getCustomization(item);

    if (!customization) {
      return false;
    }

    return Boolean(
      customization.text ||
        customization.design ||
        customization.imageUrl
    );
  };

  const openOrderDetails = (order) => {
    setSelectedOrder(order);
  };

  const closeOrderDetails = () => {
    setSelectedOrder(null);
  };

  if (loading) {
    return (
      <Loader text="Loading orders..." />
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Orders
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          View and manage customer orders.
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

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">
            Total Orders
          </p>

          <p className="mt-2 text-2xl font-bold">
            {orders.length}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">
            Pending
          </p>

          <p className="mt-2 text-2xl font-bold">
            {
              orders.filter(
                (order) =>
                  order.orderStatus ===
                    "PLACED" ||
                  order.orderStatus ===
                    "CONFIRMED"
              ).length
            }
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">
            Processing
          </p>

          <p className="mt-2 text-2xl font-bold">
            {
              orders.filter(
                (order) =>
                  order.orderStatus ===
                  "PROCESSING"
              ).length
            }
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">
            Delivered
          </p>

          <p className="mt-2 text-2xl font-bold">
            {
              orders.filter(
                (order) =>
                  order.orderStatus ===
                  "DELIVERED"
              ).length
            }
          </p>
        </div>
      </div>

      <section className="rounded-xl border bg-white shadow-sm">
        <div className="border-b p-5">
          <h2 className="font-bold text-gray-900">
            All Orders
          </h2>
        </div>

        {orders.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            No orders found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-275 text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-5 py-3 font-medium">
                    Order
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Customer
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Items
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Amount
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Payment
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Status
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Date
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {orders.map((order) => {
                  const status =
                    order.orderStatus ||
                    "PLACED";

                  const isLocked =
                    status === "CANCELLED";

                  const hasCustomization =
                    order.items?.some(
                      (item) =>
                        isCustomized(item)
                    );

                  return (
                    <tr
                      key={order._id}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900">
                          #
                          {order._id?.slice(
                            -8
                          )}
                        </p>

                        {order.razorpayOrderId && (
                          <p className="mt-1 text-xs text-gray-400">
                            {
                              order.razorpayOrderId
                            }
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium">
                          {getCustomerName(
                            order
                          )}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {getCustomerEmail(
                            order
                          )}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span>
                            {order.items
                              ?.length || 0}
                          </span>

                          {hasCustomization && (
                            <span className="rounded-full bg-purple-100 px-2 py-1 text-[10px] font-semibold text-purple-700">
                              CUSTOM
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 font-semibold">
                        ₹
                        {Number(
                          order.totalAmount || 0
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium">
                          {order.paymentMethod ||
                            "COD"}
                        </p>

                        <p
                          className={`mt-1 text-xs ${
                            order.paymentStatus ===
                            "PAID"
                              ? "text-green-600"
                              : order.paymentStatus ===
                                  "FAILED"
                                ? "text-red-600"
                                : "text-yellow-600"
                          }`}
                        >
                          {order.paymentStatus ||
                            "PENDING"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <div
                          className="relative inline-block"
                          data-status-dropdown
                        >
                          <button
                            type="button"
                            disabled={
                              updatingId ===
                                order._id ||
                              isLocked
                            }
                            onClick={() =>
                              setOpenStatusDropdownId(
                                (currentId) =>
                                  currentId ===
                                  order._id
                                    ? null
                                    : order._id
                              )
                            }
                            className={`flex min-w-36.25 items-center justify-between gap-3 rounded-full border-0 px-3 py-1.5 text-xs font-medium outline-none ${getStatusClass(
                              status
                            )} ${
                              isLocked
                                ? "cursor-not-allowed opacity-70"
                                : "cursor-pointer"
                            }`}
                          >
                            <span>{status}</span>

                            {!isLocked && (
                              <span className="text-xs">
                                {openStatusDropdownId ===
                                order._id
                                  ? "▲"
                                  : "⌄"}
                              </span>
                            )}
                          </button>

                          {openStatusDropdownId ===
                            order._id &&
                            !isLocked && (
                              <div className="absolute left-0 top-full z-50 mt-1 min-w-36.25 overflow-hidden rounded-md border border-gray-300 bg-white shadow-lg">
                                {orderStatuses.map(
                                  (statusOption) => {
                                    const disabled =
                                      isStatusOptionDisabled(
                                        status,
                                        statusOption
                                      );

                                    const isCurrent =
                                      status ===
                                      statusOption;

                                    return (
                                      <button
                                        key={
                                          statusOption
                                        }
                                        type="button"
                                        disabled={
                                          disabled
                                        }
                                        onClick={() => {
                                          if (
                                            disabled
                                          ) {
                                            return;
                                          }

                                          handleStatusChange(
                                            order._id,
                                            statusOption
                                          );
                                        }}
                                        className={`flex w-full items-center px-3 py-2 text-left text-xs font-medium transition ${getStatusClass(
                                          statusOption
                                        )} ${
                                          disabled
                                            ? "cursor-not-allowed opacity-40"
                                            : "cursor-pointer hover:brightness-95"
                                        } ${
                                          isCurrent
                                            ? "font-bold ring-1 ring-inset ring-black/10"
                                            : ""
                                        }`}
                                      >
                                        {statusOption}
                                      </button>
                                    );
                                  }
                                )}
                              </div>
                            )}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-gray-500">
                        {order.createdAt
                          ? new Date(
                              order.createdAt
                            ).toLocaleDateString(
                              "en-IN"
                            )
                          : "-"}
                      </td>

                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            openOrderDetails(
                              order
                            )
                          }
                          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showCancellationModal && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4"
          onClick={closeCancellationModal}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Cancel Order
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  Enter the reason for cancelling
                  this order.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeCancellationModal
                }
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-lg text-gray-600 hover:bg-gray-200"
              >
                ×
              </button>
            </div>

            {cancellationError && (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {cancellationError}
              </div>
            )}

            <textarea
              value={cancellationReason}
              onChange={(event) =>
                setCancellationReason(
                  event.target.value
                )
              }
              maxLength={500}
              rows={5}
              placeholder="Enter cancellation reason..."
              className="mt-5 w-full resize-none rounded-xl border border-gray-300 p-4 text-sm outline-none focus:border-black"
            />

            <div className="mt-1 text-right text-xs text-gray-500">
              {cancellationReason.length}/500
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={
                  closeCancellationModal
                }
                className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Keep Order
              </button>

              <button
                type="button"
                disabled={
                  updatingId ===
                  cancellationOrderId
                }
                onClick={
                  handleConfirmCancellation
                }
                className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updatingId ===
                cancellationOrderId
                  ? "Cancelling..."
                  : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeOrderDetails}
        >
          <div
            className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Order #
                  {selectedOrder._id?.slice(
                    -8
                  )}
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  Placed on{" "}
                  {formatDate(
                    selectedOrder.createdAt
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeOrderDetails
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-lg text-gray-600 hover:bg-gray-200"
              >
                ×
              </button>
            </div>

            <div className="space-y-6 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border p-5">
                  <h3 className="mb-4 font-bold">
                    Customer Details
                  </h3>

                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-gray-500">
                        Name:
                      </span>{" "}
                      <b>
                        {getCustomerName(
                          selectedOrder
                        )}
                      </b>
                    </p>

                    <p>
                      <span className="text-gray-500">
                        Email:
                      </span>{" "}
                      <b>
                        {getCustomerEmail(
                          selectedOrder
                        )}
                      </b>
                    </p>

                    <p>
                      <span className="text-gray-500">
                        Phone:
                      </span>{" "}
                      <b>
                        {selectedOrder
                          .shippingAddress
                          ?.phone || "-"}
                      </b>
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border p-5">
                  <h3 className="mb-4 font-bold">
                    Payment Details
                  </h3>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        Method
                      </span>

                      <b>
                        {
                          selectedOrder.paymentMethod
                        }
                      </b>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        Status
                      </span>

                      <b
                        className={
                          selectedOrder.paymentStatus ===
                          "PAID"
                            ? "text-green-600"
                            : selectedOrder.paymentStatus ===
                                "FAILED"
                              ? "text-red-600"
                              : "text-yellow-600"
                        }
                      >
                        {
                          selectedOrder.paymentStatus
                        }
                      </b>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        Total
                      </span>

                      <b>
                        ₹
                        {Number(
                          selectedOrder.totalAmount ||
                            0
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </b>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border p-5">
                <h3 className="mb-4 font-bold">
                  Shipping Address
                </h3>

                <div className="text-sm leading-6 text-gray-700">
                  <p className="font-semibold">
                    {
                      selectedOrder
                        .shippingAddress
                        ?.fullName
                    }
                  </p>

                  <p>
                    {
                      selectedOrder
                        .shippingAddress
                        ?.addressLine
                    }
                  </p>

                  <p>
                    {
                      selectedOrder
                        .shippingAddress
                        ?.city
                    }
                    ,{" "}
                    {
                      selectedOrder
                        .shippingAddress
                        ?.state
                    }
                  </p>

                  <p>
                    PIN:{" "}
                    {
                      selectedOrder
                        .shippingAddress
                        ?.pincode
                    }
                  </p>

                  <p>
                    Phone:{" "}
                    {
                      selectedOrder
                        .shippingAddress
                        ?.phone
                    }
                  </p>
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-lg font-bold">
                  Ordered Items
                </h3>

                <div className="space-y-4">
                  {selectedOrder.items?.map(
                    (item, index) => {
                      const product =
                        item.product;

                      const customization =
                        getCustomization(item);

                      const customized =
                        isCustomized(item);

                      const image =
                        getProductImage(item);

                      return (
                        <div
                          key={
                            item._id ||
                            index
                          }
                          className="rounded-xl border p-5"
                        >
                          <div className="flex flex-col gap-5 sm:flex-row">
                            <div className="h-32 w-32 shrink-0 overflow-hidden rounded-xl border bg-gray-50">
                              {image ? (
                                <img
                                  src={image}
                                  alt={
                                    product?.name ||
                                    "Product"
                                  }
                                  className="h-full w-full object-contain"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-xs text-gray-400">
                                  No Image
                                </div>
                              )}
                            </div>

                            <div className="flex-1">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <h4 className="text-lg font-bold">
                                    {product?.name ||
                                      "Product"}
                                  </h4>

                                  <p className="mt-1 text-sm text-gray-500">
                                    ₹
                                    {Number(
                                      item.price ||
                                        0
                                    ).toLocaleString(
                                      "en-IN"
                                    )}{" "}
                                    each
                                  </p>
                                </div>

                                {customized && (
                                  <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                                    CUSTOMIZED
                                  </span>
                                )}
                              </div>

                              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                <div className="rounded-lg bg-gray-50 p-3">
                                  <p className="text-xs text-gray-500">
                                    Size
                                  </p>

                                  <p className="mt-1 font-semibold">
                                    {item.size ||
                                      "-"}
                                  </p>
                                </div>

                                <div className="rounded-lg bg-gray-50 p-3">
                                  <p className="text-xs text-gray-500">
                                    Color
                                  </p>

                                  <p className="mt-1 font-semibold">
                                    {item.color ||
                                      "-"}
                                  </p>
                                </div>

                                <div className="rounded-lg bg-gray-50 p-3">
                                  <p className="text-xs text-gray-500">
                                    Quantity
                                  </p>

                                  <p className="mt-1 font-semibold">
                                    {item.quantity ||
                                      0}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {customized && (
                            <div className="mt-5 rounded-xl border border-purple-200 bg-purple-50 p-5">
                              <h4 className="font-bold text-purple-900">
                                Customization
                                Details
                              </h4>

                              {customization?.text && (
                                <div className="mt-4 rounded-lg border bg-white p-4">
                                  <p className="text-xs text-gray-500">
                                    Custom Text
                                  </p>

                                  <p className="mt-2 text-xl font-bold">
                                    "
                                    {
                                      customization.text
                                    }
                                    "
                                  </p>
                                </div>
                              )}

                              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                {customization?.textColor && (
                                  <div className="rounded-lg bg-white p-3">
                                    <p className="text-xs text-gray-500">
                                      Text Color
                                    </p>

                                    <p className="mt-1 font-semibold">
                                      {
                                        customization.textColor
                                      }
                                    </p>
                                  </div>
                                )}

                                {customization?.textSize !==
                                  undefined && (
                                  <div className="rounded-lg bg-white p-3">
                                    <p className="text-xs text-gray-500">
                                      Text Size
                                    </p>

                                    <p className="mt-1 font-semibold">
                                      {
                                        customization.textSize
                                      }
                                    </p>
                                  </div>
                                )}

                                {customization?.textScale !==
                                  undefined && (
                                  <div className="rounded-lg bg-white p-3">
                                    <p className="text-xs text-gray-500">
                                      Text Scale
                                    </p>

                                    <p className="mt-1 font-semibold">
                                      {
                                        customization.textScale
                                      }
                                    </p>
                                  </div>
                                )}

                                {customization?.textRotation !==
                                  undefined && (
                                  <div className="rounded-lg bg-white p-3">
                                    <p className="text-xs text-gray-500">
                                      Text Rotation
                                    </p>

                                    <p className="mt-1 font-semibold">
                                      {
                                        customization.textRotation
                                      }
                                      °
                                    </p>
                                  </div>
                                )}
                              </div>

                              {customization?.textPosition && (
                                <div className="mt-4 rounded-lg bg-white p-4">
                                  <p className="text-xs text-gray-500">
                                    Text Position
                                  </p>

                                  <div className="mt-2 flex gap-6 text-sm">
                                    <span>
                                      X:{" "}
                                      <b>
                                        {
                                          customization
                                            .textPosition
                                            ?.x
                                        }
                                      </b>
                                    </span>

                                    <span>
                                      Y:{" "}
                                      <b>
                                        {
                                          customization
                                            .textPosition
                                            ?.y
                                        }
                                      </b>
                                    </span>
                                  </div>
                                </div>
                              )}

                              {customization?.design && (
                                <div className="mt-4 rounded-lg bg-white p-4">
                                  <p className="mb-3 font-bold text-gray-900">
                                    Admin Design Details
                                  </p>

                                  <div className="flex flex-col gap-4 sm:flex-row">
                                    {(customization.design.image ||
                                      customization.design.imageUrl) && (
                                      <div className="h-28 w-28 shrink-0 overflow-hidden rounded-lg border bg-gray-50 p-1">
                                        <img
                                          src={
                                            customization.design.image ||
                                            customization.design.imageUrl
                                          }
                                          alt="Admin Design"
                                          className="h-full w-full object-contain"
                                        />
                                      </div>
                                    )}

                                    <div className="space-y-1 text-xs">
                                      <p className="text-sm">
                                        <span className="text-gray-500">Name:</span>{" "}
                                        <b>{customization.design.name || "Admin Design"}</b>
                                      </p>

                                      <p>
                                        <span className="text-gray-500">Scale:</span>{" "}
                                        <b>
                                          {(
                                            customization.adminDesignScale ??
                                            customization.designScale ??
                                            1
                                          ).toFixed(1)}
                                          x
                                        </b>
                                      </p>

                                      <p>
                                        <span className="text-gray-500">Position:</span>{" "}
                                        <b>
                                          X:{" "}
                                          {customization.adminDesignPosition?.x ??
                                            customization.designPosition?.x ??
                                            50}
                                          , Y:{" "}
                                          {customization.adminDesignPosition?.y ??
                                            customization.designPosition?.y ??
                                            65}
                                        </b>
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {customization?.imageUrl && (
                                <div className="mt-4 rounded-lg bg-white p-4">
                                  <p className="mb-3 font-bold text-gray-900">
                                    User Uploaded Design Details
                                  </p>

                                  <div className="flex flex-col gap-4 sm:flex-row">
                                    <div className="h-28 w-28 shrink-0 overflow-hidden rounded-lg border bg-gray-50 p-1">
                                      <img
                                        src={customization.imageUrl}
                                        alt="Uploaded Design"
                                        className="h-full w-full object-contain"
                                      />
                                    </div>

                                    <div className="flex flex-col justify-between space-y-2 text-xs">
                                      <div>
                                        {customization.originalFileName && (
                                          <p className="text-sm">
                                            <span className="text-gray-500">File Name:</span>{" "}
                                            <b>{customization.originalFileName}</b>
                                          </p>
                                        )}

                                        <p className="mt-1">
                                          <span className="text-gray-500">Scale:</span>{" "}
                                          <b>
                                            {(
                                              customization.userDesignScale ?? 1
                                            ).toFixed(1)}
                                            x
                                          </b>
                                        </p>

                                        <p className="mt-1">
                                          <span className="text-gray-500">Position:</span>{" "}
                                          <b>
                                            X:{" "}
                                            {customization.userDesignPosition?.x ??
                                              50}
                                            , Y:{" "}
                                            {customization.userDesignPosition?.y ??
                                              35}
                                          </b>
                                        </p>
                                      </div>

                                      <div className="mt-3 flex flex-wrap gap-2">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setPreviewImageModal({
                                              url: customization.imageUrl,
                                              fileName:
                                                customization.originalFileName ||
                                                "Uploaded Design",
                                            })
                                          }
                                          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                        >
                                          Preview Image
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleDownloadImage(
                                              customization.imageUrl,
                                              customization.originalFileName ||
                                                "uploaded-design.png"
                                            )
                                          }
                                          className="rounded-lg bg-black px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800"
                                        >
                                          Download Image
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              <div className="mt-4 border-t border-purple-200 pt-3">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPreviewTShirtModal({
                                      baseImage: image,
                                      customization,
                                      item,
                                    })
                                  }
                                  className="w-full rounded-full bg-purple-700 px-4 py-2.5 text-xs font-semibold text-white hover:bg-purple-800 transition-all shadow-sm"
                                >
                                  View Final T-Shirt Preview
                                </button>
                              </div>
                            </div>
                          )}

                          {!customized && (
                            <div className="mt-4 rounded-lg bg-gray-50 p-4">
                              <p className="text-sm font-medium">
                                Standard Product
                              </p>

                              <p className="mt-1 text-xs text-gray-500">
                                No customization
                                requested.
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              <div className="rounded-xl border bg-gray-50 p-5">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Subtotal
                  </span>

                  <span className="font-medium">
                    ₹
                    {Number(
                      selectedOrder.subtotal ||
                        0
                    ).toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="mt-2 flex justify-between">
                  <span className="text-gray-600">
                    Discount
                  </span>

                  <span className="font-medium text-green-600">
                    - ₹
                    {Number(
                      selectedOrder.discountAmount ||
                        0
                    ).toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="my-4 border-t" />

                <div className="flex justify-between">
                  <span className="text-lg font-bold">
                    Total
                  </span>

                  <span className="text-lg font-bold">
                    ₹
                    {Number(
                      selectedOrder.totalAmount ||
                        0
                    ).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {selectedOrder.cancellationReason && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                  <h3 className="font-bold text-red-800">
                    Cancellation Reason
                  </h3>

                  <p className="mt-2 whitespace-pre-wrap text-sm text-red-700">
                    {
                      selectedOrder.cancellationReason
                    }
                  </p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 border-t bg-white px-6 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className="text-sm text-gray-500">
                    Order Status
                  </span>

                  <div className="mt-1">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                        selectedOrder.orderStatus
                      )}`}
                    >
                      {
                        selectedOrder.orderStatus
                      }
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={
                    closeOrderDetails
                  }
                  className="rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {previewImageModal && (
        <div
          className="fixed inset-0 z-70 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setPreviewImageModal(null)}
        >
          <div
            className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Uploaded Design Preview
                </h3>
                <p className="text-xs text-gray-500">
                  {previewImageModal.fileName}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPreviewImageModal(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-lg text-gray-600 hover:bg-gray-200"
              >
                ×
              </button>
            </div>

            <div className="my-6 flex max-h-[65vh] items-center justify-center overflow-hidden rounded-xl border bg-gray-50 p-4">
              <img
                src={previewImageModal.url}
                alt={previewImageModal.fileName}
                className="max-h-[60vh] max-w-full object-contain"
              />
            </div>

            <div className="flex justify-end gap-3 border-t pt-4">
              <button
                type="button"
                onClick={() =>
                  handleDownloadImage(
                    previewImageModal.url,
                    previewImageModal.fileName
                  )
                }
                className="rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
              >
                Download Design
              </button>

              <button
                type="button"
                onClick={() => setPreviewImageModal(null)}
                className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {previewTShirtModal && (
        <div
          className="fixed inset-0 z-70 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setPreviewTShirtModal(null)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Final T-Shirt Customization Preview
                </h3>
                <p className="text-xs text-gray-500">
                  Customer's configured design layout
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPreviewTShirtModal(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-lg text-gray-600 hover:bg-gray-200"
              >
                ×
              </button>
            </div>

            <div className="my-6 flex items-center justify-center">
              <div className="relative aspect-square w-full max-w-md overflow-hidden rounded-xl border border-gray-200 bg-white">
                {previewTShirtModal.baseImage ? (
                  <img
                    src={previewTShirtModal.baseImage}
                    alt="T-Shirt Base"
                    className="absolute inset-0 h-full w-full object-contain"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
                    No base image
                  </div>
                )}

                {/* User Uploaded Design Layer */}
                {previewTShirtModal.customization?.imageUrl && (
                  <img
                    src={previewTShirtModal.customization.imageUrl}
                    alt="User Uploaded Design"
                    className="absolute h-auto max-w-[35%] object-contain"
                    style={{
                      left: `${
                        previewTShirtModal.customization.userDesignPosition?.x ?? 50
                      }%`,
                      top: `${
                        previewTShirtModal.customization.userDesignPosition?.y ?? 35
                      }%`,
                      transform: `translate(-50%, -50%) scale(${
                        previewTShirtModal.customization.userDesignScale ?? 1
                      })`,
                    }}
                  />
                )}

                {/* Admin Design Layer */}
                {previewTShirtModal.customization?.design && (
                  <img
                    src={
                      previewTShirtModal.customization.design.image ||
                      previewTShirtModal.customization.design.imageUrl
                    }
                    alt="Admin Design"
                    className="absolute h-auto max-w-[35%] object-contain"
                    style={{
                      left: `${
                        previewTShirtModal.customization.adminDesignPosition?.x ??
                        previewTShirtModal.customization.designPosition?.x ??
                        50
                      }%`,
                      top: `${
                        previewTShirtModal.customization.adminDesignPosition?.y ??
                        previewTShirtModal.customization.designPosition?.y ??
                        65
                      }%`,
                      transform: `translate(-50%, -50%) scale(${
                        previewTShirtModal.customization.adminDesignScale ??
                        previewTShirtModal.customization.designScale ??
                        1
                      })`,
                    }}
                  />
                )}

                {/* Custom Text Layer */}
                {previewTShirtModal.customization?.text && (
                  <div
                    className="absolute whitespace-nowrap font-bold"
                    style={{
                      left: `${
                        previewTShirtModal.customization.textPosition?.x ?? 50
                      }%`,
                      top: `${
                        previewTShirtModal.customization.textPosition?.y ?? 50
                      }%`,
                      color: previewTShirtModal.customization.textColor || "#000000",
                      fontSize: `${
                        previewTShirtModal.customization.textSize || 24
                      }px`,
                      transform: `translate(-50%, -50%) scale(${
                        previewTShirtModal.customization.textScale || 1
                      }) rotate(${
                        previewTShirtModal.customization.textRotation || 0
                      }deg)`,
                    }}
                  >
                    {previewTShirtModal.customization.text}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t pt-4">
              <button
                type="button"
                onClick={() => setPreviewTShirtModal(null)}
                className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;