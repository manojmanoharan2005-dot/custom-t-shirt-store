import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import Loader from "../components/Loader";
import cartService from "../services/cartService";
import authService from "../services/authService";
import orderService from "../services/orderService";
import couponService from "../services/couponService";
import paymentService from "../services/paymentService";
import { useNotification } from "../context/NotificationContext";
import loadRazorpaySDK from "../utils/loadRazorpay";

const Checkout = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [cart, setCart] = useState(null);
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState("ONLINE");

  const [address, setAddress] = useState({
    fullName: "",
    phone: "",
    addressLine: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const paymentSuccessRef = useRef(false);
  const paymentFailedRef = useRef(false);
  const paymentVerificationRef = useRef(false);

  const loadCheckoutData = async () => {
    try {
      setLoading(true);

      const [cartResponse, profileResponse] = await Promise.all([
        cartService.getCart(),
        authService.getProfile(),
      ]);

      const loadedCart = cartResponse.cart;
      const loadedUser = profileResponse.user;

      setCart(loadedCart);
      setUser(loadedUser);

      const firstAddress = loadedUser?.addresses?.[0];

      if (firstAddress) {
        setAddress({
          fullName: firstAddress.fullName || "",
          phone: firstAddress.phone || "",
          addressLine: firstAddress.addressLine || "",
          city: firstAddress.city || "",
          state: firstAddress.state || "",
          pincode: firstAddress.pincode || "",
        });
      } else {
        setAddress({
          fullName: loadedUser?.name || "",
          phone: loadedUser?.phone || "",
          addressLine: "",
          city: "",
          state: "",
          pincode: "",
        });
      }
    } catch (error) {
      console.error("Failed to load checkout:", error);

      showNotification(
        error.response?.data?.message ||
          "Failed to load checkout.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCheckoutData();
  }, []);

  const handleAddressChange = (event) => {
    const { name, value } = event.target;

    setAddress((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleApplyCoupon = async () => {
    const code = couponCode.trim();

    if (!code) {
      showNotification(
        "Please enter a coupon code.",
        "warning"
      );
      return;
    }

    if (!cart?.totalAmount) {
      showNotification(
        "Cart is empty.",
        "error"
      );
      return;
    }

    try {
      setCouponLoading(true);

      const response = await couponService.validateCoupon({
        code: code.toUpperCase(),
        orderAmount: cart.totalAmount,
      });

      setCoupon(response.coupon || response);

      showNotification(
        response.message || "Coupon applied successfully.",
        "success"
      );
    } catch (error) {
      console.error("Coupon validation error:", error);

      setCoupon(null);

      showNotification(
        error.response?.data?.message || "Invalid coupon.",
        "error"
      );
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCoupon(null);
    setCouponCode("");

    showNotification(
      "Coupon removed.",
      "info"
    );
  };

  const subtotal = Number(cart?.totalAmount || 0);

  let discountAmount = 0;

  if (coupon) {
    if (coupon.discountType === "PERCENTAGE") {
      discountAmount =
        (subtotal * Number(coupon.discountValue || 0)) / 100;

      const maximumDiscount = Number(
        coupon.maximumDiscount ??
          coupon.maxDiscountAmount ??
          0
      );

      if (
        maximumDiscount > 0 &&
        discountAmount > maximumDiscount
      ) {
        discountAmount = maximumDiscount;
      }
    }

    if (coupon.discountType === "FIXED") {
      discountAmount = Number(coupon.discountValue || 0);
    }

    discountAmount = Math.min(discountAmount, subtotal);
  }

  const totalAmount = Math.max(
    0,
    subtotal - discountAmount
  );

  const formatPrice = (amount) =>
    Number(amount || 0).toLocaleString("en-IN");

  const validateCheckout = () => {
    if (!cart?.items?.length) {
      return "Your cart is empty.";
    }

    if (!address.fullName.trim()) {
      return "Full name is required.";
    }

    if (!address.phone.trim()) {
      return "Phone number is required.";
    }

    if (!/^[0-9]{10}$/.test(address.phone.trim())) {
      return "Please enter a valid 10-digit phone number.";
    }

    if (!address.addressLine.trim()) {
      return "Address is required.";
    }

    if (!address.city.trim()) {
      return "City is required.";
    }

    if (!address.state.trim()) {
      return "State is required.";
    }

    if (!address.pincode.trim()) {
      return "Pincode is required.";
    }

    if (!/^[0-9]{6}$/.test(address.pincode.trim())) {
      return "Please enter a valid 6-digit pincode.";
    }

    return null;
  };

  const saveCheckoutAddressIfNew = async () => {
    const currentAddress = {
      fullName: address.fullName.trim(),
      phone: address.phone.trim(),
      addressLine: address.addressLine.trim(),
      city: address.city.trim(),
      state: address.state.trim(),
      pincode: address.pincode.trim(),
    };

    const existingAddresses = user?.addresses || [];
    const exists = existingAddresses.some((existing) => {
      return (
        (existing.fullName || "").trim().toLowerCase() ===
          currentAddress.fullName.toLowerCase() &&
        (existing.phone || "").trim() === currentAddress.phone &&
        (existing.addressLine || "").trim().toLowerCase() ===
          currentAddress.addressLine.toLowerCase() &&
        (existing.city || "").trim().toLowerCase() ===
          currentAddress.city.toLowerCase() &&
        (existing.state || "").trim().toLowerCase() ===
          currentAddress.state.toLowerCase() &&
        (existing.pincode || "").trim() === currentAddress.pincode
      );
    });

    if (!exists) {
      try {
        const response = await authService.addAddress(currentAddress);
        if (response?.user) {
          setUser(response.user);
        }
      } catch (error) {
        console.error("Failed to auto-save checkout address:", error);
      }
    }
  };

  const createBackendOrder = async () => {
    await saveCheckoutAddressIfNew();

    const orderData = {
      shippingAddress: {
        fullName: address.fullName.trim(),
        phone: address.phone.trim(),
        addressLine: address.addressLine.trim(),
        city: address.city.trim(),
        state: address.state.trim(),
        pincode: address.pincode.trim(),
      },
      paymentMethod,
      ...(coupon?.code
        ? {
            couponCode: coupon.code,
          }
        : {}),
    };

    const response = await orderService.createOrder(orderData);

    return response.order || response;
  };

  const handleCashOnDelivery = async () => {
    const validationError = validateCheckout();

    if (validationError) {
      showNotification(
        validationError,
        "warning"
      );
      return;
    }

    try {
      setProcessing(true);

      const order = await createBackendOrder();

      if (!order?._id) {
        throw new Error(
          "Order was created but order ID was not returned."
        );
      }

      navigate(`/orders/${order._id}`);
    } catch (error) {
      console.error("COD order error:", error);

      showNotification(
        error.response?.data?.message ||
          error.message ||
          "Failed to place order.",
        "error"
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleOnlinePayment = async () => {
    const validationError = validateCheckout();

    if (validationError) {
      showNotification(
        validationError,
        "warning"
      );
      return;
    }

    let createdOrderId = null;

    try {
      setProcessing(true);

      paymentSuccessRef.current = false;
      paymentFailedRef.current = false;
      paymentVerificationRef.current = false;

      const order = await createBackendOrder();

      if (!order?._id) {
        throw new Error(
          "Order ID was not returned from server."
        );
      }

      createdOrderId = order._id;

      const paymentResponse =
        await paymentService.createPaymentOrder({
          orderId: order._id,
        });

      const paymentOrder = paymentResponse?.paymentOrder;

      if (!paymentOrder?.keyId) {
        throw new Error(
          "Razorpay key was not returned by server."
        );
      }

      if (!paymentOrder?.id) {
        throw new Error(
          "Razorpay order ID was not returned by server."
        );
      }

      if (
        paymentOrder.amount === undefined ||
        paymentOrder.amount === null
      ) {
        throw new Error(
          "Razorpay amount was not returned by server."
        );
      }

      if (!window.Razorpay) {
        await loadRazorpaySDK();
      }

      if (!window.Razorpay) {
        throw new Error(
          "Failed to load Razorpay SDK. Please check your internet connection and try again."
        );
      }

      const options = {
        key: paymentOrder.keyId,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency || "INR",

        name: "CustomTee",
        description: "Custom T-Shirt Order",
        order_id: paymentOrder.id,

        prefill: {
          name: address.fullName || user?.name || "",
          email: user?.email || "",
          contact: address.phone || user?.phone || "",
        },

        notes: {
          orderId: order._id,
        },

        theme: {
          color: "#000000",
        },

        handler: async (razorpayResponse) => {
          if (paymentVerificationRef.current) {
            return;
          }

          paymentVerificationRef.current = true;
          paymentSuccessRef.current = true;

          try {
            setProcessing(true);

            await paymentService.verifyPayment({
              orderId: order._id,
              razorpayOrderId:
                razorpayResponse.razorpay_order_id || paymentOrder.id,
              razorpayPaymentId:
                razorpayResponse.razorpay_payment_id,
              razorpaySignature:
                razorpayResponse.razorpay_signature,
            });

            showNotification(
              "Payment successful. Your order has been placed.",
              "success"
            );

            navigate(`/orders/${order._id}`, {
              replace: true,
            });
          } catch (error) {
            console.error(
              "Payment verification error:",
              error
            );

            showNotification(
              error.response?.data?.message ||
                error.message ||
                "Payment verification failed. Please check your order status before trying again.",
              "error"
            );

            paymentSuccessRef.current = false;
          } finally {
            setProcessing(false);
          }
        },

        modal: {
          ondismiss: async () => {
            if (
              paymentSuccessRef.current ||
              paymentFailedRef.current ||
              !createdOrderId
            ) {
              return;
            }

            try {
              setProcessing(true);

              await paymentService.markPaymentFailed({
                orderId: createdOrderId,
              });

              showNotification(
                "Payment was cancelled. Your order has been cancelled.",
                "warning"
              );
            } catch (error) {
              console.error(
                "Payment cancellation error:",
                error
              );

              showNotification(
                error.response?.data?.message ||
                  "Payment was cancelled, but the order status could not be updated.",
                "error"
              );
            } finally {
              setProcessing(false);
            }
          },
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", async (response) => {
        paymentFailedRef.current = true;

        try {
          setProcessing(true);

          await paymentService.markPaymentFailed({
            orderId: createdOrderId,
          });

          showNotification(
            response.error?.description ||
              "Payment failed. Your order has been cancelled.",
            "error"
          );
        } catch (error) {
          console.error(
            "Failed to update payment failure:",
            error
          );

          showNotification(
            error.response?.data?.message ||
              response.error?.description ||
              "Payment failed. Please check your order status.",
            "error"
          );
        } finally {
          setProcessing(false);
        }
      });

      razorpay.open();

      setProcessing(true);
    } catch (error) {
      console.error("Online payment error:", error);

      if (
        createdOrderId &&
        !paymentSuccessRef.current &&
        !paymentFailedRef.current
      ) {
        try {
          await paymentService.markPaymentFailed({
            orderId: createdOrderId,
          });
        } catch (failureError) {
          console.error(
            "Failed to update abandoned payment order:",
            failureError
          );
        }
      }

      showNotification(
        error.response?.data?.message ||
          error.message ||
          "Unable to start online payment.",
        "error"
      );

      setProcessing(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (processing) {
      return;
    }

    if (paymentMethod === "COD") {
      await handleCashOnDelivery();
      return;
    }

    await handleOnlinePayment();
  };

  if (loading) {
    return <Loader text="Loading checkout..." />;
  }

  if (!cart?.items?.length) {
    return (
      <main className="min-h-[70vh] bg-white px-5 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-lg border border-gray-200 bg-white p-10 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">
            Your cart is empty
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Add some products before checkout.
          </p>

          <button
            type="button"
            onClick={() => navigate("/products")}
            className="mt-6 bg-black px-6 py-3 text-sm font-medium text-white hover:bg-gray-800"
          >
            Continue Shopping
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-5 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="border-b border-gray-200 pb-7">
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-gray-400">
            Cart / Checkout
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-950">
            Checkout
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Review your order and complete your purchase.
          </p>
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
          <div className="space-y-8">
            <section className="border border-gray-200 bg-white">
              <div className="border-b border-gray-200 px-6 py-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center bg-black text-sm font-semibold text-white">
                    1
                  </span>

                  <div>
                    <h2 className="font-semibold text-gray-900">
                      Delivery Address
                    </h2>

                    <p className="mt-0.5 text-xs text-gray-500">
                      Enter the address where you want your order delivered.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-800">
                      Full Name
                    </label>

                    <input
                      type="text"
                      name="fullName"
                      value={address.fullName}
                      onChange={handleAddressChange}
                      placeholder="Enter your full name"
                      className="h-11 w-full border border-gray-300 px-3 text-sm outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-800">
                      Phone Number
                    </label>

                    <input
                      type="tel"
                      name="phone"
                      value={address.phone}
                      onChange={handleAddressChange}
                      maxLength={10}
                      inputMode="numeric"
                      placeholder="10-digit mobile number"
                      className="h-11 w-full border border-gray-300 px-3 text-sm outline-none focus:border-black"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-gray-800">
                      Address
                    </label>

                    <textarea
                      name="addressLine"
                      value={address.addressLine}
                      onChange={handleAddressChange}
                      rows={3}
                      placeholder="House number, street, area"
                      className="w-full resize-none border border-gray-300 px-3 py-3 text-sm outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-800">
                      City
                    </label>

                    <input
                      type="text"
                      name="city"
                      value={address.city}
                      onChange={handleAddressChange}
                      placeholder="Enter city"
                      className="h-11 w-full border border-gray-300 px-3 text-sm outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-800">
                      State
                    </label>

                    <input
                      type="text"
                      name="state"
                      value={address.state}
                      onChange={handleAddressChange}
                      placeholder="Enter state"
                      className="h-11 w-full border border-gray-300 px-3 text-sm outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-800">
                      Pincode
                    </label>

                    <input
                      type="text"
                      name="pincode"
                      value={address.pincode}
                      onChange={handleAddressChange}
                      maxLength={6}
                      inputMode="numeric"
                      placeholder="6-digit pincode"
                      className="h-11 w-full border border-gray-300 px-3 text-sm outline-none focus:border-black"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="border border-gray-200 bg-white">
              <div className="border-b border-gray-200 px-6 py-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center bg-black text-sm font-semibold text-white">
                    2
                  </span>

                  <div>
                    <h2 className="font-semibold text-gray-900">
                      Payment Method
                    </h2>

                    <p className="mt-0.5 text-xs text-gray-500">
                      Choose your preferred payment method.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 p-6">
                <label
                  className={`block cursor-pointer border p-4 ${
                    paymentMethod === "COD"
                      ? "border-black bg-gray-50"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="COD"
                      checked={paymentMethod === "COD"}
                      onChange={(event) =>
                        setPaymentMethod(event.target.value)
                      }
                      className="mt-1 h-4 w-4"
                    />

                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Cash on Delivery
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Pay when your order is delivered.
                      </p>
                    </div>
                  </div>
                </label>

                <label
                  className={`block cursor-pointer border p-4 ${
                    paymentMethod === "ONLINE"
                      ? "border-black bg-gray-50"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="ONLINE"
                      checked={paymentMethod === "ONLINE"}
                      onChange={(event) =>
                        setPaymentMethod(event.target.value)
                      }
                      className="mt-1 h-4 w-4"
                    />

                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Online Payment
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Pay securely using Razorpay.
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            </section>
          </div>

          <aside className="h-fit border border-gray-200 bg-white lg:sticky lg:top-24">
            <div className="border-b border-gray-200 px-5 py-5">
              <h2 className="font-semibold text-gray-900">
                Order Summary
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                {cart.items.length}{" "}
                {cart.items.length === 1 ? "item" : "items"}
              </p>
            </div>

            <div className="max-h-80 overflow-y-auto px-5">
              {cart.items.map((item) => {
                const price = Number(
                  item.price ??
                    item.product?.price ??
                    0
                );

                const itemTotal =
                  price * Number(item.quantity || 0);

                return (
                  <div
                    key={item._id}
                    className="flex gap-3 border-b border-gray-100 py-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {item.product?.name || "Product"}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Qty {item.quantity}
                      </p>

                      <p className="mt-0.5 text-xs text-gray-400">
                        {item.size} · {item.color}
                      </p>
                    </div>

                    <p className="shrink-0 text-sm font-medium text-gray-900">
                      ₹{formatPrice(itemTotal)}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="border-b border-gray-200 px-5 py-5">
              <label className="mb-2 block text-sm font-medium text-gray-800">
                Coupon
              </label>

              {!coupon ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(event) =>
                      setCouponCode(event.target.value)
                    }
                    placeholder="Coupon code"
                    className="min-w-0 flex-1 border border-gray-300 px-3 py-2.5 text-sm uppercase outline-none focus:border-black"
                  />

                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading}
                    className="bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {couponLoading ? "..." : "Apply"}
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between border border-green-200 bg-green-50 px-3 py-3">
                  <div>
                    <p className="text-sm font-semibold text-green-700">
                      {coupon.code}
                    </p>

                    <p className="mt-0.5 text-xs text-green-600">
                      Coupon applied
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-xs font-medium text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            <div className="px-5 py-5">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>

                  <span>₹{formatPrice(subtotal)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>

                    <span>
                      - ₹{formatPrice(discountAmount)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>

                  <span className="font-medium text-green-600">
                    Free
                  </span>
                </div>
              </div>

              <div className="mt-5 border-t border-gray-200 pt-5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">
                    Total
                  </span>

                  <span className="text-xl font-semibold text-gray-950">
                    ₹{formatPrice(totalAmount)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={processing}
                className="mt-6 w-full bg-black px-5 py-3.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processing
                  ? "Processing..."
                  : paymentMethod === "COD"
                    ? `Place Order · ₹${formatPrice(totalAmount)}`
                    : `Pay ₹${formatPrice(totalAmount)}`}
              </button>

              <p className="mt-3 text-center text-xs leading-5 text-gray-400">
                Your payment information is securely processed.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
};

export default Checkout;