import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Loader from "../components/Loader";
import cartService from "../services/cartService";
import { useNotification } from "../context/NotificationContext";

const Cart = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const loadCart = async () => {
    try {
      setLoading(true);

      const response = await cartService.getCart();
      setCart(response.cart);
    } catch (err) {
      console.error("Failed to load cart:", err);

      showNotification(
        err.response?.data?.message || "Failed to load cart.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const updateQuantity = async (itemId, quantity) => {
    if (quantity < 1) return;

    try {
      setUpdatingId(itemId);

      const response = await cartService.updateCartItem(itemId, {
        quantity,
      });

      setCart(response.cart);
    } catch (err) {
      console.error("Update cart error:", err);

      showNotification(
        err.response?.data?.message ||
          "Failed to update quantity.",
        "error"
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const removeItem = async (itemId) => {
    try {
      setUpdatingId(itemId);

      const response = await cartService.removeCartItem(itemId);

      setCart(response.cart);

      showNotification(
        "Item removed from cart.",
        "success"
      );
    } catch (err) {
      console.error("Remove item error:", err);

      showNotification(
        err.response?.data?.message ||
          "Failed to remove item.",
        "error"
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const getItemPrice = (item) =>
    item.price ?? item.product?.price ?? 0;

  const getItemTotal = (item) =>
    getItemPrice(item) * (item.quantity || 1);

  const items = cart?.items || [];

  const subtotal =
    cart?.subtotal !== undefined
      ? cart.subtotal
      : items.reduce(
          (total, item) => total + getItemTotal(item),
          0
        );

  const itemCount = items.reduce(
    (total, item) => total + (item.quantity || 0),
    0
  );

  if (loading) {
    return <Loader text="Loading cart..." />;
  }

  if (!items.length) {
    return (
      <main className="min-h-[70vh] bg-white px-5 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-lg border border-gray-200 p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center border border-gray-200 text-xl">
            🛒
          </div>

          <h1 className="mt-6 text-2xl font-semibold text-gray-900">
            Your cart is empty
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            Add a few products and come back here when you're ready.
          </p>

          <Link
            to="/products"
            className="mt-7 inline-block bg-black px-6 py-3 text-sm font-medium text-white hover:bg-gray-800"
          >
            Browse Products
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-5 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="border-b border-gray-200 pb-7">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.15em] text-gray-400">
                Shopping Cart
              </p>

              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-950">
                Your Cart
              </h1>

              <p className="mt-2 text-sm text-gray-500">
                {itemCount}{" "}
                {itemCount === 1 ? "item" : "items"} in your cart
              </p>
            </div>

            <Link
              to="/products"
              className="hidden text-sm text-gray-500 hover:text-black sm:block"
            >
              ← Continue Shopping
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_340px]">
          <section>
            <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-4">
              <h2 className="text-base font-semibold text-gray-900">
                Cart Items
              </h2>

              <span className="text-sm text-gray-500">
                {itemCount}{" "}
                {itemCount === 1 ? "item" : "items"}
              </span>
            </div>

            <div className="divide-y divide-gray-200 border-y border-gray-200">
              {items.map((item) => {
                const product = item.product;
                const itemPrice = getItemPrice(item);
                const itemTotal = getItemTotal(item);

                const selectedVariant = product?.variants?.find(
                  (variant) =>
                    variant.color?.trim().toLowerCase() ===
                    item.color?.trim().toLowerCase()
                );

                const image =
                  selectedVariant?.image ||
                  product?.variants?.[0]?.image ||
                  item.image ||
                  "";

                const productLink = product?._id
                  ? `/products/${product._id}`
                  : "/products";

                const isUpdating = updatingId === item._id;

                return (
                  <div key={item._id} className="py-6">
                    <div className="flex gap-4 sm:gap-6">
                      <Link
                        to={productLink}
                        className="h-28 w-24 shrink-0 overflow-hidden bg-gray-100 sm:h-36 sm:w-32"
                      >
                        {image ? (
                          <img
                            src={image}
                            alt={product?.name || "Product"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-gray-400">
                            No image
                          </div>
                        )}
                      </Link>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <Link
                              to={productLink}
                              className="line-clamp-2 text-base font-medium text-gray-900 hover:underline"
                            >
                              {product?.name ||
                                item.productName ||
                                "Product"}
                            </Link>

                            <p className="mt-1 text-sm text-gray-500">
                              ₹
                              {Number(itemPrice).toLocaleString(
                                "en-IN"
                              )}
                            </p>
                          </div>

                          <p className="shrink-0 text-base font-semibold text-gray-900">
                            ₹
                            {Number(itemTotal).toLocaleString(
                              "en-IN"
                            )}
                          </p>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500">
                          {item.size && (
                            <span>
                              Size:{" "}
                              <span className="font-medium text-gray-900">
                                {item.size}
                              </span>
                            </span>
                          )}

                          {item.color && (
                            <span>
                              Color:{" "}
                              <span className="font-medium text-gray-900">
                                {item.color}
                              </span>
                            </span>
                          )}

                          {item.customization && (
                            <span className="font-medium text-black">
                              Customized
                            </span>
                          )}
                        </div>

                        {item.customization && (
                          <div className="mt-3 border-l-2 border-gray-300 pl-3">
                            {item.customization.text && (
                              <p className="text-sm text-gray-600">
                                Text:{" "}
                                <span className="font-medium text-gray-900">
                                  {item.customization.text}
                                </span>
                              </p>
                            )}

                            {item.customization.design && (
                              <p className="mt-1 text-xs text-gray-500">
                                Custom design added
                              </p>
                            )}

                            {item.customization.imageUrl && (
                              <div className="mt-2 flex items-center gap-2">
                                <img
                                  src={item.customization.imageUrl}
                                  alt="Uploaded Design"
                                  className="h-10 w-10 border border-gray-200 bg-gray-50 object-contain"
                                />
                                <span className="text-xs text-gray-500">
                                  User Uploaded Design
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="mt-5 flex items-center justify-between">
                          <div className="flex items-center border border-gray-300">
                            <button
                              type="button"
                              disabled={
                                isUpdating ||
                                item.quantity <= 1
                              }
                              onClick={() =>
                                updateQuantity(
                                  item._id,
                                  item.quantity - 1
                                )
                              }
                              className="px-4 py-2 text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
                            >
                              −
                            </button>

                            <span className="min-w-12 border-x border-gray-300 px-3 py-2 text-center text-sm font-medium">
                              {item.quantity}
                            </span>

                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() =>
                                updateQuantity(
                                  item._id,
                                  item.quantity + 1
                                )
                              }
                              className="px-4 py-2 text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
                            >
                              +
                            </button>
                          </div>

                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() =>
                              removeItem(item._id)
                            }
                            className="text-sm text-gray-500 hover:text-red-600 disabled:text-gray-300"
                          >
                            {isUpdating
                              ? "Updating..."
                              : "Remove"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <aside className="h-fit border border-gray-200 lg:sticky lg:top-24">
            <div className="border-b border-gray-200 px-5 py-4">
              <h2 className="text-base font-semibold text-gray-900">
                Order Summary
              </h2>
            </div>

            <div className="p-5">
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">
                    Items
                  </span>

                  <span className="font-medium text-gray-900">
                    {itemCount}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">
                    Subtotal
                  </span>

                  <span className="font-medium text-gray-900">
                    ₹{Number(subtotal).toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">
                    Shipping
                  </span>

                  <span className="font-medium text-green-600">
                    Free
                  </span>
                </div>
              </div>

              <div className="mt-6 border-t border-gray-200 pt-5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">
                    Total
                  </span>

                  <span className="text-xl font-semibold text-gray-950">
                    ₹{Number(subtotal).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate("/checkout")}
                className="mt-6 w-full bg-black px-6 py-3.5 text-sm font-semibold text-white hover:bg-gray-800"
              >
                Proceed to Checkout
              </button>

              <Link
                to="/products"
                className="mt-4 block text-center text-sm text-gray-500 hover:text-black"
              >
                Continue Shopping
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
};

export default Cart;