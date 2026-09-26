import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import Loader from "../components/Loader";
import productService from "../services/productService";
import designService from "../services/designService";
import customizationService from "../services/customizationService";
import cartService from "../services/cartService";
import { useNotification } from "../context/NotificationContext";

const Customizer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { showNotification } = useNotification();

  const [product, setProduct] = useState(null);
  const [designs, setDesigns] = useState([]);

  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");

  const [customText, setCustomText] = useState("");
  const [textColor, setTextColor] = useState("#000000");
  const [textFontSize, setTextFontSize] = useState(24);
  const [textScale, setTextScale] = useState(1);
  const [textRotation, setTextRotation] = useState(0);

  const [textPosition, setTextPosition] = useState({
    x: 50,
    y: 50,
  });

  const [selectedDesign, setSelectedDesign] = useState(null);
  const [designScale, setDesignScale] = useState(1);
  const [designRotation, setDesignRotation] = useState(0);

  const [designPosition, setDesignPosition] = useState({
    x: 50,
    y: 65,
  });

  const [upload1, setUpload1] = useState({ file: null, preview: "" });
  const [upload2, setUpload2] = useState({ file: null, preview: "" });
  const [activeDesignSource, setActiveDesignSource] = useState(null);
  const [userDesignError, setUserDesignError] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    return () => {
      if (upload1.preview) URL.revokeObjectURL(upload1.preview);
      if (upload2.preview) URL.revokeObjectURL(upload2.preview);
    };
  }, []);

  const handleUserDesignSelect = (event, slotIndex) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedMimeTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
    ];

    if (!allowedMimeTypes.includes(file.type)) {
      setUserDesignError("Please upload a PNG, JPG or WEBP image.");
      showNotification("Please upload a PNG, JPG or WEBP image.", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUserDesignError("Image must be smaller than 5 MB.");
      showNotification("Image must be smaller than 5 MB.", "error");
      return;
    }

    const newPreview = URL.createObjectURL(file);

    if (slotIndex === 1) {
      if (upload1.preview) URL.revokeObjectURL(upload1.preview);
      setUpload1({ file, preview: newPreview });
      setActiveDesignSource({ type: "upload1" });
      setSelectedDesign(null);
    } else {
      if (upload2.preview) URL.revokeObjectURL(upload2.preview);
      setUpload2({ file, preview: newPreview });
      setActiveDesignSource({ type: "upload2" });
      setSelectedDesign(null);
    }

    setUserDesignError("");
  };

  const handleRemoveUserDesign = (slotIndex) => {
    if (slotIndex === 1) {
      if (upload1.preview) URL.revokeObjectURL(upload1.preview);
      setUpload1({ file: null, preview: "" });
      if (activeDesignSource?.type === "upload1") {
        setActiveDesignSource(null);
      }
    } else {
      if (upload2.preview) URL.revokeObjectURL(upload2.preview);
      setUpload2({ file: null, preview: "" });
      if (activeDesignSource?.type === "upload2") {
        setActiveDesignSource(null);
      }
    }
    setUserDesignError("");
  };

  const selectUploadAsActive = (slotIndex) => {
    if (slotIndex === 1 && upload1.file) {
      setActiveDesignSource({ type: "upload1" });
      setSelectedDesign(null);
    } else if (slotIndex === 2 && upload2.file) {
      setActiveDesignSource({ type: "upload2" });
      setSelectedDesign(null);
    }
  };

  const selectAdminDesignAsActive = (design) => {
    setSelectedDesign(design);
    setActiveDesignSource({ type: "admin", id: design._id });
  };

  const loadData = async () => {
    try {
      setLoading(true);

      const [productResponse, designResponse] =
        await Promise.all([
          productService.getProductById(id),
          designService.getDesigns(),
        ]);

      const productData = productResponse?.product;

      if (!productData) {
        throw new Error("Product not found.");
      }

      if (!productData.customizable) {
        throw new Error(
          "This product cannot be customized."
        );
      }

      setProduct(productData);
      setDesigns(designResponse?.designs || []);

      const variants = Array.isArray(
        productData.variants
      )
        ? productData.variants
        : [];

      const availableColors = variants
        .map((variant) => variant?.color?.trim())
        .filter(Boolean);

      const passedSize = location.state?.size;

      if (
        passedSize &&
        productData.sizes?.includes(passedSize)
      ) {
        setSelectedSize(passedSize);
      } else {
        setSelectedSize(
          productData.sizes?.[0] || ""
        );
      }

      const passedColor =
        location.state?.color?.trim();

      if (passedColor) {
        const matchedColor =
          availableColors.find(
            (color) =>
              color.toLowerCase() ===
              passedColor.toLowerCase()
          );

        if (matchedColor) {
          setSelectedColor(matchedColor);
        } else if (
          availableColors.length > 0
        ) {
          setSelectedColor(
            availableColors[0]
          );
        } else {
          setSelectedColor("");
        }
      } else if (
        availableColors.length > 0
      ) {
        setSelectedColor(
          availableColors[0]
        );
      } else {
        setSelectedColor("");
      }
    } catch (error) {
      console.error(
        "Failed to load customizer:",
        error
      );

      showNotification(
        error.response?.data?.message ||
          error.message ||
          "Failed to load customization.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const selectedVariant =
    product?.variants?.find(
      (variant) =>
        variant?.color
          ?.trim()
          .toLowerCase() ===
        selectedColor
          ?.trim()
          .toLowerCase()
    );

  const previewImage =
    selectedColor &&
    selectedVariant?.image
      ? selectedVariant.image
      : product?.images?.[0] ||
        product?.variants?.[0]?.image ||
        "";

  const availableColors = Array.isArray(
    product?.variants
  )
    ? product.variants
        .map((variant) =>
          variant?.color?.trim()
        )
        .filter(Boolean)
    : [];

  const updateTextPosition = (
    field,
    value
  ) => {
    setTextPosition((current) => ({
      ...current,
      [field]: Number(value),
    }));
  };

  const updateDesignPosition = (
    field,
    value
  ) => {
    setDesignPosition((current) => ({
      ...current,
      [field]: Number(value),
    }));
  };

  const activeUpload =
    activeDesignSource?.type === "upload1"
      ? upload1
      : activeDesignSource?.type === "upload2"
        ? upload2
        : null;

  const activeUserDesignPreview = activeUpload?.preview || "";
  const activeUserDesignFile = activeUpload?.file || null;

  const activeDesignName = activeUserDesignFile
    ? activeUserDesignFile.name
    : selectedDesign?.name || "None";

  const handleSaveAndAddToCart = async () => {
    const productId = product?._id || id;
    const size = selectedSize || product?.sizes?.[0] || "";
    const color = selectedColor || availableColors?.[0] || "";
    const text = customText.trim();

    if (!productId) {
      showNotification("Product information is missing.", "error");
      return;
    }

    if (!product?.customizable) {
      showNotification("This product cannot be customized.", "error");
      return;
    }

    if (!size) {
      showNotification("Please select a size.", "warning");
      return;
    }

    if (!color) {
      showNotification("Please select a color.", "warning");
      return;
    }

    if (!text && !selectedDesign && !activeUserDesignFile) {
      showNotification(
        "Please add text, select a design, or upload your design.",
        "warning"
      );
      return;
    }

    try {
      setSaving(true);

      let customizationData;
      if (activeUserDesignFile) {
        const formData = new FormData();
        formData.append("product", productId);
        formData.append("size", size);
        formData.append("color", color);
        formData.append("text", text);
        formData.append("textColor", textColor);
        formData.append(
          "textPosition",
          JSON.stringify({
            x: Number(textPosition.x),
            y: Number(textPosition.y),
          })
        );
        formData.append("textSize", Number(textFontSize));
        formData.append("textScale", Number(textScale));
        formData.append("textRotation", Number(textRotation));
        formData.append(
          "designPosition",
          JSON.stringify({
            x: Number(designPosition.x),
            y: Number(designPosition.y),
          })
        );
        formData.append(
          "designSize",
          JSON.stringify({ width: 100, height: 100 })
        );
        formData.append("designScale", Number(designScale));
        formData.append("designRotation", Number(designRotation));
        formData.append("userDesign", activeUserDesignFile);

        customizationData = formData;
      } else {
        customizationData = {
          product: productId,
          size,
          color,
          text,
          textColor,
          textPosition: {
            x: Number(textPosition.x),
            y: Number(textPosition.y),
          },
          textSize: Number(textFontSize),
          textScale: Number(textScale),
          textRotation: Number(textRotation),
          design: selectedDesign?._id || null,
          designPosition: {
            x: Number(designPosition.x),
            y: Number(designPosition.y),
          },
          designSize: {
            width: 100,
            height: 100,
          },
          designScale: Number(designScale),
          designRotation: Number(designRotation),
        };
      }

      const response = await customizationService.createCustomization(
        customizationData
      );

      const customization = response?.customization;

      if (!customization?._id) {
        throw new Error("Customization was not created.");
      }

      await cartService.addToCart({
        product: productId,
        size,
        color,
        quantity: 1,
        customization: customization._id,
      });

      showNotification("Customization saved and added to cart.", "success");

      setTimeout(() => {
        navigate("/cart");
      }, 700);
    } catch (error) {
      console.error("Customization error:", error);

      showNotification(
        error.response?.data?.message ||
          error.message ||
          "Failed to save customization.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loader text="Loading customizer..." />;
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-5 py-16 text-center sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-gray-900">
          Product not found
        </h2>

        <Link
          to="/products"
          className="mt-5 inline-block bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
        >
          Back to Products
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200 pb-7">
          <Link
            to={`/products/${product._id}`}
            className="text-sm text-gray-500 hover:text-black"
          >
            ← Back to Product
          </Link>

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
              Customizer
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-950 sm:text-4xl">
              Customize Your T-Shirt
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-gray-500">
              Choose your size and color, then add text or a design to create
              your own T-shirt.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="lg:sticky lg:top-6 lg:self-start">
            <div className="border border-gray-200 bg-white">
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    Live Preview
                  </h2>

                  <p className="mt-1 text-xs text-gray-500">
                    See how your design looks on the T-shirt.
                  </p>
                </div>

                <span className="text-base font-semibold text-gray-900">
                  ₹{Number(product.price || 0).toLocaleString("en-IN")}
                </span>
              </div>

              <div className="bg-gray-100 p-5 sm:p-8">
                <div className="mx-auto flex aspect-square w-full max-w-xl items-center justify-center">
                  <div className="relative aspect-square w-full max-w-md overflow-hidden bg-white">
                    {previewImage ? (
                      <img
                        src={previewImage}
                        alt={
                          selectedColor
                            ? `${product.name} ${selectedColor}`
                            : product.name
                        }
                        className="absolute inset-0 h-full w-full object-contain"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
                        No product image
                      </div>
                    )}

                    {activeUserDesignPreview ? (
                      <img
                        src={activeUserDesignPreview}
                        alt="Uploaded Design"
                        className="absolute h-auto max-w-[35%] object-contain"
                        style={{
                          left: `${designPosition.x}%`,
                          top: `${designPosition.y}%`,
                          transform:
                            `translate(-50%, -50%) ` +
                            `scale(${designScale}) ` +
                            `rotate(${designRotation}deg)`,
                        }}
                      />
                    ) : selectedDesign ? (
                      <img
                        src={
                          selectedDesign.image || selectedDesign.imageUrl
                        }
                        alt={selectedDesign.name || "Design"}
                        className="absolute h-auto max-w-[35%] object-contain"
                        style={{
                          left: `${designPosition.x}%`,
                          top: `${designPosition.y}%`,
                          transform:
                            `translate(-50%, -50%) ` +
                            `scale(${designScale}) ` +
                            `rotate(${designRotation}deg)`,
                        }}
                      />
                    ) : null}

                    {customText && (
                      <div
                        className="absolute whitespace-nowrap font-bold"
                        style={{
                          left: `${textPosition.x}%`,
                          top: `${textPosition.y}%`,
                          color: textColor,
                          fontSize: `${textFontSize}px`,
                          transform:
                            `translate(-50%, -50%) ` +
                            `scale(${textScale}) ` +
                            `rotate(${textRotation}deg)`,
                        }}
                      >
                        {customText}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 border-t border-gray-200">
                <div className="border-r border-gray-200 p-4">
                  <p className="text-xs text-gray-400">Size</p>

                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {selectedSize || "-"}
                  </p>
                </div>

                <div className="border-r border-gray-200 p-4">
                  <p className="text-xs text-gray-400">Color</p>

                  <p className="mt-1 truncate text-sm font-semibold text-gray-900">
                    {selectedColor || "-"}
                  </p>
                </div>

                <div className="p-4">
                  <p className="text-xs text-gray-400">Design</p>

                  <p className="mt-1 truncate text-sm font-semibold text-gray-900">
                    {activeDesignName}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <div className="space-y-6">
            <section className="border border-gray-200 bg-white">
              <div className="border-b border-gray-200 px-5 py-4">
                <h2 className="text-base font-semibold text-gray-900">
                  Product Options
                </h2>
              </div>

              <div className="p-5">
                <p className="mb-3 text-sm font-medium text-gray-900">Size</p>

                <div className="flex flex-wrap gap-2">
                  {product.sizes?.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-12 border px-4 py-2.5 text-sm ${
                        selectedSize === size
                          ? "border-black bg-black text-white"
                          : "border-gray-300 bg-white text-gray-700 hover:border-black"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>

                <div className="mt-6">
                  <p className="mb-3 text-sm font-medium text-gray-900">Color</p>

                  <div className="flex flex-wrap gap-2">
                    {availableColors.length > 0 ? (
                      availableColors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setSelectedColor(color)}
                          className={`border px-4 py-2.5 text-sm ${
                            selectedColor === color
                              ? "border-black bg-black text-white"
                              : "border-gray-300 bg-white text-gray-700 hover:border-black"
                          }`}
                        >
                          {color}
                        </button>
                      ))
                    ) : (
                      <p className="text-sm text-gray-400">
                        No colors available
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="border border-gray-200 bg-white">
              <div className="border-b border-gray-200 px-5 py-4">
                <h2 className="text-base font-semibold text-gray-900">
                  Add Text
                </h2>
              </div>

              <div className="p-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-gray-900">
                    Your Text
                  </span>

                  <input
                    type="text"
                    value={customText}
                    maxLength={100}
                    onChange={(event) => setCustomText(event.target.value)}
                    placeholder="Enter your text"
                    className="h-11 w-full border border-gray-300 px-3 text-sm outline-none focus:border-black"
                  />

                  <span className="mt-1 block text-right text-xs text-gray-400">
                    {customText.length}/100
                  </span>
                </label>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      Text Color
                    </span>

                    <span className="text-xs text-gray-500">{textColor}</span>
                  </div>

                  <input
                    type="color"
                    value={textColor}
                    onChange={(event) => setTextColor(event.target.value)}
                    className="h-10 w-full cursor-pointer border border-gray-300 bg-white p-1"
                  />
                </div>

                <div className="mt-6">
                  <div className="mb-2 flex justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      Font Size
                    </span>

                    <span className="text-xs text-gray-500">
                      {textFontSize}px
                    </span>
                  </div>

                  <input
                    type="range"
                    min="12"
                    max="60"
                    value={textFontSize}
                    onChange={(event) =>
                      setTextFontSize(Number(event.target.value))
                    }
                    className="w-full"
                  />
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      Text Scale
                    </span>

                    <span className="text-xs text-gray-500">{textScale}x</span>
                  </div>

                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={textScale}
                    onChange={(event) =>
                      setTextScale(Number(event.target.value))
                    }
                    className="w-full"
                  />
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      Text Rotation
                    </span>

                    <span className="text-xs text-gray-500">
                      {textRotation}°
                    </span>
                  </div>

                  <input
                    type="range"
                    min="-180"
                    max="180"
                    value={textRotation}
                    onChange={(event) =>
                      setTextRotation(Number(event.target.value))
                    }
                    className="w-full"
                  />
                </div>

                <div className="mt-6">
                  <p className="mb-3 text-sm font-medium text-gray-900">
                    Text Position
                  </p>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <div className="mb-2 flex justify-between">
                        <span className="text-xs text-gray-500">Horizontal</span>

                        <span className="text-xs text-gray-500">
                          {textPosition.x}
                        </span>
                      </div>

                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={textPosition.x}
                        onChange={(event) =>
                          updateTextPosition("x", event.target.value)
                        }
                        className="w-full"
                      />
                    </div>

                    <div>
                      <div className="mb-2 flex justify-between">
                        <span className="text-xs text-gray-500">Vertical</span>

                        <span className="text-xs text-gray-500">
                          {textPosition.y}
                        </span>
                      </div>

                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={textPosition.y}
                        onChange={(event) =>
                          updateTextPosition("y", event.target.value)
                        }
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="border border-gray-200 bg-white">
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    Upload Your Design
                  </h2>

                  <p className="mt-1 text-xs text-gray-500">
                    Upload up to 2 personal designs (PNG, JPG or WEBP • Max 5 MB).
                  </p>
                </div>
              </div>

              <div className="p-5">
                {userDesignError && (
                  <div className="mb-4 text-xs font-medium text-red-600">
                    {userDesignError}
                  </div>
                )}

                {upload1.file && upload2.file && (
                  <div className="mb-4 text-xs font-medium text-gray-500">
                    Maximum 2 designs allowed.
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Upload Slot 1 */}
                  <div
                    className={`border p-3 ${
                      activeDesignSource?.type === "upload1"
                        ? "border-black bg-gray-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-900">
                        Upload 1
                      </span>
                      {upload1.file && (
                        <span className="text-[10px] text-gray-500">
                          {activeDesignSource?.type === "upload1"
                            ? "ACTIVE"
                            : ""}
                        </span>
                      )}
                    </div>

                    {upload1.preview ? (
                      <div>
                        <div
                          className="flex cursor-pointer items-center gap-3"
                          onClick={() => selectUploadAsActive(1)}
                        >
                          <div className="h-16 w-16 shrink-0 overflow-hidden border border-gray-200 bg-white p-1">
                            <img
                              src={upload1.preview}
                              alt="Upload 1 Preview"
                              className="h-full w-full object-contain"
                            />
                          </div>

                          <div className="min-w-0 flex-1 text-xs">
                            <p className="truncate font-medium text-gray-900">
                              {upload1.file.name}
                            </p>
                            <p className="mt-0.5 text-gray-500">
                              {(upload1.file.size / (1024 * 1024)).toFixed(
                                2
                              )}{" "}
                              MB
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-2 text-xs">
                          <label className="cursor-pointer font-medium text-black hover:underline">
                            Replace Image
                            <input
                              type="file"
                              accept="image/png, image/jpeg, image/jpg, image/webp"
                              onChange={(e) => handleUserDesignSelect(e, 1)}
                              className="hidden"
                            />
                          </label>

                          <button
                            type="button"
                            onClick={() => handleRemoveUserDesign(1)}
                            className="text-red-600 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="flex cursor-pointer flex-col items-center justify-center border border-dashed border-gray-300 py-6 text-center hover:border-gray-400">
                        <span className="border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-800 hover:bg-gray-100">
                          Choose Image
                        </span>
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/jpg, image/webp"
                          onChange={(e) => handleUserDesignSelect(e, 1)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Upload Slot 2 */}
                  <div
                    className={`border p-3 ${
                      activeDesignSource?.type === "upload2"
                        ? "border-black bg-gray-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-900">
                        Upload 2
                      </span>
                      {upload2.file && (
                        <span className="text-[10px] text-gray-500">
                          {activeDesignSource?.type === "upload2"
                            ? "ACTIVE"
                            : ""}
                        </span>
                      )}
                    </div>

                    {upload2.preview ? (
                      <div>
                        <div
                          className="flex cursor-pointer items-center gap-3"
                          onClick={() => selectUploadAsActive(2)}
                        >
                          <div className="h-16 w-16 shrink-0 overflow-hidden border border-gray-200 bg-white p-1">
                            <img
                              src={upload2.preview}
                              alt="Upload 2 Preview"
                              className="h-full w-full object-contain"
                            />
                          </div>

                          <div className="min-w-0 flex-1 text-xs">
                            <p className="truncate font-medium text-gray-900">
                              {upload2.file.name}
                            </p>
                            <p className="mt-0.5 text-gray-500">
                              {(upload2.file.size / (1024 * 1024)).toFixed(
                                2
                              )}{" "}
                              MB
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-2 text-xs">
                          <label className="cursor-pointer font-medium text-black hover:underline">
                            Replace Image
                            <input
                              type="file"
                              accept="image/png, image/jpeg, image/jpg, image/webp"
                              onChange={(e) => handleUserDesignSelect(e, 2)}
                              className="hidden"
                            />
                          </label>

                          <button
                            type="button"
                            onClick={() => handleRemoveUserDesign(2)}
                            className="text-red-600 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="flex cursor-pointer flex-col items-center justify-center border border-dashed border-gray-300 py-6 text-center hover:border-gray-400">
                        <span className="border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-800 hover:bg-gray-100">
                          Choose Image
                        </span>
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/jpg, image/webp"
                          onChange={(e) => handleUserDesignSelect(e, 2)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="border border-gray-200 bg-white">
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    Choose a Design
                  </h2>

                  <p className="mt-1 text-xs text-gray-500">
                    Select a design to add to your T-shirt.
                  </p>
                </div>

                {selectedDesign && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDesign(null);
                      if (activeDesignSource?.type === "admin") {
                        setActiveDesignSource(null);
                      }
                    }}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="p-5">
                <div className="grid grid-cols-2 gap-3">
                  {designs.length === 0 ? (
                    <div className="col-span-2 border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
                      No designs available.
                    </div>
                  ) : (
                    designs.map((design) => {
                      const image = design.image || design.imageUrl;
                      const selected =
                        activeDesignSource?.type === "admin" &&
                        selectedDesign?._id === design._id;

                      return (
                        <button
                          key={design._id}
                          type="button"
                          onClick={() => selectAdminDesignAsActive(design)}
                          className={`border p-2 text-left transition-all ${
                            selected
                              ? "border-black ring-1 ring-black"
                              : "border-gray-200 hover:border-gray-500"
                          }`}
                        >
                          <div className="aspect-square overflow-hidden bg-gray-100">
                            {image ? (
                              <img
                                src={image}
                                alt={design.name || "Design"}
                                className="h-full w-full object-contain"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-xs text-gray-400">
                                No image
                              </div>
                            )}
                          </div>

                          <p className="mt-2 truncate text-xs font-medium text-gray-900">
                            {design.name || "Unnamed Design"}
                          </p>
                        </button>
                      );
                    })
                  )}
                </div>

                <div
                  className={`mt-6 ${
                    selectedDesign || activeUserDesignPreview
                      ? ""
                      : "opacity-50"
                  }`}
                >
                  <div className="mb-2 flex justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      Design Scale
                    </span>

                    <span className="text-xs text-gray-500">
                      {designScale}x
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0.2"
                    max="3.0"
                    step="0.1"
                    value={designScale}
                    disabled={!selectedDesign && !activeUserDesignPreview}
                    onChange={(event) =>
                      setDesignScale(Number(event.target.value))
                    }
                    className="w-full"
                  />
                </div>

                <div
                  className={`mt-5 ${
                    selectedDesign || activeUserDesignPreview
                      ? ""
                      : "opacity-50"
                  }`}
                >
                  <div className="mb-2 flex justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      Design Rotation
                    </span>

                    <span className="text-xs text-gray-500">
                      {designRotation}°
                    </span>
                  </div>

                  <input
                    type="range"
                    min="-180"
                    max="180"
                    value={designRotation}
                    disabled={!selectedDesign && !activeUserDesignPreview}
                    onChange={(event) =>
                      setDesignRotation(Number(event.target.value))
                    }
                    className="w-full"
                  />
                </div>

                <div
                  className={`mt-6 ${
                    selectedDesign || activeUserDesignPreview
                      ? ""
                      : "opacity-50"
                  }`}
                >
                  <p className="mb-3 text-sm font-medium text-gray-900">
                    Design Position
                  </p>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <div className="mb-2 flex justify-between">
                        <span className="text-xs text-gray-500">
                          Horizontal
                        </span>

                        <span className="text-xs text-gray-500">
                          {designPosition.x}
                        </span>
                      </div>

                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={designPosition.x}
                        disabled={!selectedDesign && !activeUserDesignPreview}
                        onChange={(event) =>
                          updateDesignPosition("x", event.target.value)
                        }
                        className="w-full"
                      />
                    </div>

                    <div>
                      <div className="mb-2 flex justify-between">
                        <span className="text-xs text-gray-500">Vertical</span>

                        <span className="text-xs text-gray-500">
                          {designPosition.y}
                        </span>
                      </div>

                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={designPosition.y}
                        disabled={!selectedDesign && !activeUserDesignPreview}
                        onChange={(event) =>
                          updateDesignPosition("y", event.target.value)
                        }
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Product Price</span>

                <span className="text-xl font-semibold text-gray-900">
                  ₹{Number(product.price || 0).toLocaleString("en-IN")}
                </span>
              </div>

              <button
                type="button"
                onClick={handleSaveAndAddToCart}
                disabled={saving}
                className="mt-5 w-full bg-black px-5 py-3.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save & Add to Cart"}
              </button>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Customizer;