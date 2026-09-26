import { useEffect, useRef, useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import productService from "../services/productService";
import cartService from "../services/cartService";
import Loader from "../components/Loader";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";

const ProductDetails = () => {
  const { id: paramId, slug: paramSlug } = useParams();
  const slug = paramSlug || paramId;
  const navigate = useNavigate();
  const location = useLocation();

  const { isAuthenticated } = useAuth();
  const { showNotification } = useNotification();

  const [product, setProduct] = useState(null);

  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);

  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);

  const selectionKey = `productSelection_${slug}`;

  const pendingActionHandledRef = useRef(false);

  const pendingAction =
    location.state?.pendingAction || null;

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);

        const response =
          await productService.getProductById(slug);

        const loadedProduct = response.product;

        setProduct(loadedProduct);

        if (loadedProduct?.slug && slug !== loadedProduct.slug) {
          navigate(`/products/${loadedProduct.slug}`, { replace: true });
        }

        const variants = Array.isArray(
          loadedProduct?.variants
        )
          ? loadedProduct.variants
          : [];

        const savedSelection =
          sessionStorage.getItem(selectionKey);

        if (savedSelection) {
          try {
            const parsedSelection =
              JSON.parse(savedSelection);

            const savedSize =
              parsedSelection?.size || "";

            const savedColor =
              parsedSelection?.color || "";

            const savedQuantity =
              Number(
                parsedSelection?.quantity
              ) || 1;

            if (
              savedSize &&
              Array.isArray(loadedProduct?.sizes) &&
              loadedProduct.sizes.includes(savedSize)
            ) {
              setSelectedSize(savedSize);
            } else {
              setSelectedSize("");
            }

            const savedVariant =
              variants.find(
                (variant) =>
                  variant.color === savedColor
              );

            if (savedVariant) {
              setSelectedColor(
                savedVariant.color
              );
            } else {
              setSelectedColor("");
            }

            if (
              savedQuantity >= 1 &&
              savedQuantity <=
                loadedProduct.stock
            ) {
              setQuantity(savedQuantity);
            } else {
              setQuantity(1);
            }
          } catch (error) {
            console.error(
              "Failed to restore product selection:",
              error
            );

            sessionStorage.removeItem(
              selectionKey
            );

            setSelectedSize("");
            setSelectedColor("");
            setQuantity(1);
          }
        } else {
          setSelectedSize("");
          setSelectedColor("");
          setQuantity(1);
        }
      } catch (error) {
        console.error(
          "Failed to load product:",
          error
        );

        showNotification(
          error.response?.data?.message ||
            "Failed to load product.",
          "error"
        );
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  const selectedVariant =
    product?.variants?.find(
      (variant) =>
        variant.color === selectedColor
    );

  const mainImage =
    selectedColor && selectedVariant?.image
      ? selectedVariant.image
      : product?.images?.[0] ||
        product?.variants?.[0]?.image ||
        "";

  const saveSelection = () => {
    sessionStorage.setItem(
      selectionKey,
      JSON.stringify({
        size: selectedSize,
        color: selectedColor,
        quantity,
      })
    );
  };

  const validateSelection = () => {
    if (!product?._id) {
      showNotification(
        "Product information is missing.",
        "error"
      );

      return false;
    }

    if (!selectedSize) {
      showNotification(
        "Please select a size.",
        "error"
      );

      return false;
    }

    if (!selectedColor) {
      showNotification(
        "Please select a color.",
        "error"
      );

      return false;
    }

    if (!selectedVariant) {
      showNotification(
        "Selected color is not available.",
        "error"
      );

      return false;
    }

    if (quantity < 1) {
      showNotification(
        "Quantity must be at least 1.",
        "error"
      );

      return false;
    }

    if (quantity > product.stock) {
      showNotification(
        "Selected quantity is not available.",
        "error"
      );

      return false;
    }

    return true;
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      saveSelection();

      navigate("/login", {
        state: {
          from: `/products/${product?.slug || slug}`,
          pendingAction: "add-to-cart",
        },
      });

      return;
    }

    if (!validateSelection()) {
      return;
    }

    try {
      setAddingToCart(true);

      await cartService.addToCart({
        product: product._id,
        size: selectedSize,
        color: selectedColor,
        quantity,
      });

      sessionStorage.removeItem(
        selectionKey
      );

      showNotification(
        "Product added to cart successfully.",
        "success"
      );

      setTimeout(() => {
        navigate("/cart");
      }, 700);
    } catch (error) {
      console.error(
        "Add to cart error:",
        error
      );

      showNotification(
        error.response?.data?.message ||
          "Failed to add product to cart.",
        "error"
      );
    } finally {
      setAddingToCart(false);
    }
  };

  const increaseQuantity = () => {
    if (!product) {
      return;
    }

    if (quantity < product.stock) {
      setQuantity(
        (current) => current + 1
      );
    }
  };

  const decreaseQuantity = () => {
    setQuantity(
      (current) =>
        current > 1 ? current - 1 : 1
    );
  };

  const handleCustomize = () => {
    if (!isAuthenticated) {
      saveSelection();

      navigate("/login", {
        state: {
          from: `/products/${product?.slug || slug}`,
          pendingAction: "customize",
        },
      });

      return;
    }

    if (
      !selectedSize ||
      !selectedColor
    ) {
      showNotification(
        "Please select size and color before customizing.",
        "error"
      );

      return;
    }

    if (!selectedVariant) {
      showNotification(
        "Selected color is not available.",
        "error"
      );

      return;
    }

    navigate(`/customize/${id}`, {
      state: {
        size: selectedSize,
        color: selectedColor,
      },
    });
  };

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    if (!product) {
      return;
    }

    if (!pendingAction) {
      return;
    }

    if (pendingActionHandledRef.current) {
      return;
    }

    if (!selectedSize || !selectedColor) {
      return;
    }

    pendingActionHandledRef.current = true;

    if (
      pendingAction === "add-to-cart"
    ) {
      handleAddToCart();

      window.history.replaceState(
        {},
        document.title,
        window.location.href
      );

      return;
    }

    if (
      pendingAction === "customize"
    ) {
      navigate(`/customize/${id}`, {
        replace: true,
        state: {
          size: selectedSize,
          color: selectedColor,
        },
      });

      window.history.replaceState(
        {},
        document.title,
        window.location.href
      );
    }
  }, [
    isAuthenticated,
    product,
    selectedSize,
    selectedColor,
    pendingAction,
    id,
    navigate,
  ]);

  if (loading) {
    return (
      <Loader text="Loading product..." />
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="border border-gray-200 bg-white p-10 text-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Product not found
          </h2>

          <button
            type="button"
            onClick={() =>
              navigate("/products")
            }
            className="mt-5 bg-black px-5 py-3 text-sm font-medium text-white hover:bg-gray-800"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">

      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-8 sm:py-8 md:py-12">

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-5 text-sm text-gray-500 hover:text-black sm:mb-8"
        >
          ← Back to Products
        </button>

        <div className="grid gap-7 lg:grid-cols-2 lg:gap-16">

          <div>

            <div
              className="
                flex
                h-80
                items-center
                justify-center
                border
                border-gray-200
                bg-gray-50
                sm:min-h-105
                sm:h-auto
                md:min-h-130
              "
            >
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={
                    selectedColor
                      ? `${product.name} ${selectedColor}`
                      : product.name
                  }
                  className="
                    h-full
                    w-full
                    object-contain
                    p-3
                    sm:max-h-130
                    sm:p-10
                  "
                />
              ) : (
                <p className="text-sm text-gray-400">
                  No product image
                </p>
              )}
            </div>

            {product.variants?.length > 0 && (
              <div
                className="
                  mt-3
                  flex
                  gap-2
                  overflow-x-auto
                  pb-1
                  sm:mt-4
                  sm:grid
                  sm:grid-cols-5
                  sm:gap-3
                  sm:overflow-visible
                "
              >
                {product.variants.map(
                  (variant) => (
                    <button
                      key={variant.color}
                      type="button"
                      onClick={() =>
                        setSelectedColor(
                          variant.color
                        )
                      }
                      className={`
                        w-20.5
                        shrink-0
                        overflow-hidden
                        border
                        bg-white
                        sm:w-auto
                        ${
                          selectedColor ===
                          variant.color
                            ? "border-black"
                            : "border-gray-200 hover:border-gray-400"
                        }
                      `}
                    >
                      {variant.image ? (
                        <img
                          src={variant.image}
                          alt={`${product.name} ${variant.color}`}
                          className="
                            h-20.5
                            w-full
                            object-cover
                            sm:h-28
                          "
                        />
                      ) : (
                        <div
                          className="
                            flex
                            h-20.5
                            items-center
                            justify-center
                            text-xs
                            text-gray-400
                            sm:h-28
                          "
                        >
                          No image
                        </div>
                      )}

                      <p
                        className={`
                          truncate
                          border-t
                          px-1
                          py-1.5
                          text-[11px]
                          sm:px-2
                          sm:py-2
                          sm:text-xs
                          ${
                            selectedColor ===
                            variant.color
                              ? "font-semibold text-black"
                              : "text-gray-500"
                          }
                        `}
                      >
                        {variant.color}
                      </p>
                    </button>
                  )
                )}
              </div>
            )}

          </div>

          <div className="lg:pt-2">

            <p className="text-xs text-gray-500 sm:text-sm">
              {product.category}
            </p>

            <h1
              className="
                mt-1.5
                text-2xl
                font-semibold
                tracking-tight
                text-gray-950
                sm:mt-2
                sm:text-4xl
              "
            >
              {product.name}
            </h1>

            <p
              className="
                mt-3
                text-2xl
                font-semibold
                text-gray-950
                sm:mt-5
              "
            >
              ₹
              {Number(
                product.price || 0
              ).toLocaleString("en-IN")}
            </p>

            <p
              className="
                mt-3
                text-sm
                leading-6
                text-gray-600
                sm:mt-5
                sm:leading-7
              "
            >
              {product.description}
            </p>

            <div className="mt-3 sm:mt-5">
              {product.stock > 0 ? (
                <p className="text-sm text-gray-500">
                  {product.stock} items available
                </p>
              ) : (
                <p className="text-sm font-medium text-red-600">
                  Out of stock
                </p>
              )}
            </div>

            <div
              className="
                mt-6
                border-t
                border-gray-200
                pt-5
                sm:mt-8
                sm:pt-7
              "
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">
                  Size
                </h3>

                <span className="text-sm text-gray-500">
                  {selectedSize ||
                    "Select size"}
                </span>
              </div>

              <div className="mt-2.5 flex flex-wrap gap-2 sm:mt-3">
                {product.sizes?.map(
                  (size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() =>
                        setSelectedSize(
                          size
                        )
                      }
                      className={`
                        min-w-12
                        border
                        px-4
                        py-2
                        text-sm
                        sm:py-2.5
                        ${
                          selectedSize ===
                          size
                            ? "border-black bg-black text-white"
                            : "border-gray-300 bg-white text-gray-900 hover:border-black"
                        }
                      `}
                    >
                      {size}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="mt-5 sm:mt-7">

              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">
                  Color
                </h3>

                <span className="text-sm text-gray-500">
                  {selectedColor ||
                    "Select color"}
                </span>
              </div>

              <div className="mt-2.5 flex flex-wrap gap-2 sm:mt-3">
                {product.variants?.map(
                  (variant) => (
                    <button
                      key={variant.color}
                      type="button"
                      onClick={() =>
                        setSelectedColor(
                          variant.color
                        )
                      }
                      className={`
                        border
                        px-4
                        py-2
                        text-sm
                        sm:py-2.5
                        ${
                          selectedColor ===
                          variant.color
                            ? "border-black bg-black text-white"
                            : "border-gray-300 bg-white text-gray-900 hover:border-black"
                        }
                      `}
                    >
                      {variant.color}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="mt-5 sm:mt-7">

              <h3 className="text-sm font-medium text-gray-900">
                Quantity
              </h3>

              <div
                className="
                  mt-2.5
                  flex
                  w-fit
                  items-center
                  border
                  border-gray-300
                  sm:mt-3
                "
              >

                <button
                  type="button"
                  onClick={
                    decreaseQuantity
                  }
                  className="
                    px-4
                    py-2
                    text-lg
                    text-gray-700
                    hover:bg-gray-100
                    sm:px-5
                    sm:py-2.5
                  "
                >
                  −
                </button>

                <span
                  className="
                    min-w-12
                    border-x
                    border-gray-300
                    px-4
                    py-2
                    text-center
                    text-sm
                    font-medium
                    sm:min-w-14
                    sm:px-5
                    sm:py-2.5
                  "
                >
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={
                    increaseQuantity
                  }
                  disabled={
                    quantity >=
                    product.stock
                  }
                  className="
                    px-4
                    py-2
                    text-lg
                    text-gray-700
                    hover:bg-gray-100
                    disabled:cursor-not-allowed
                    disabled:opacity-40
                    sm:px-5
                    sm:py-2.5
                  "
                >
                  +
                </button>

              </div>
            </div>

            <div
              className="
                mt-6
                border-t
                border-gray-200
                pt-5
                sm:mt-8
                sm:pt-7
              "
            >

              <button
                type="button"
                onClick={
                  handleAddToCart
                }
                disabled={
                  addingToCart ||
                  product.stock <= 0
                }
                className="
                  w-full
                  bg-black
                  px-6
                  py-3.5
                  text-sm
                  font-medium
                  text-white
                  hover:bg-gray-800
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                  sm:py-4
                "
              >
                {addingToCart
                  ? "Adding to Cart..."
                  : product.stock <= 0
                    ? "Out of Stock"
                    : "Add to Cart"}
              </button>

              {product.customizable && (
                <button
                  type="button"
                  onClick={
                    handleCustomize
                  }
                  className="
                    mt-2.5
                    w-full
                    border
                    border-black
                    px-6
                    py-3.5
                    text-sm
                    font-medium
                    text-black
                    hover:bg-gray-50
                    sm:mt-3
                    sm:py-4
                  "
                >
                  Customize T-Shirt
                </button>
              )}

            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;