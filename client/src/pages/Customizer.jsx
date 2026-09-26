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

const FONT_OPTIONS = [
  "Inter",
  "Arial",
  "Roboto",
  "Poppins",
  "Montserrat",
  "Oswald",
  "Bebas Neue",
  "Playfair Display",
  "Georgia",
  "Courier New",
];

const Customizer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { showNotification } = useNotification();

  const [product, setProduct] = useState(null);
  const [designs, setDesigns] = useState([]);

  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");

  // Dynamic Text Elements State
  const [texts, setTexts] = useState([
    {
      id: "text-1",
      text: "",
      fontFamily: "Inter",
      textColor: "#000000",
      fontSize: 24,
      scale: 1,
      rotation: 0,
      positionX: 50,
      positionY: 50,
    },
  ]);

  // Admin Design State
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [adminDesignScale, setAdminDesignScale] = useState(1);
  const [adminDesignPosition, setAdminDesignPosition] = useState({
    x: 50,
    y: 65,
  });

  // Dynamic User Uploaded Designs State
  const [userDesigns, setUserDesigns] = useState([
    {
      id: "design-1",
      file: null,
      preview: "",
      scale: 1,
      rotation: 0,
      positionX: 50,
      positionY: 35,
    },
  ]);

  const [userDesignError, setUserDesignError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    return () => {
      userDesigns.forEach((ud) => {
        if (ud.preview) {
          URL.revokeObjectURL(ud.preview);
        }
      });
    };
  }, [userDesigns]);

  // Handler for adding dynamic text element
  const handleAddText = () => {
    const newId = `text-${Date.now()}`;
    setTexts((prev) => [
      ...prev,
      {
        id: newId,
        text: "",
        fontFamily: "Inter",
        textColor: "#000000",
        fontSize: 24,
        scale: 1,
        rotation: 0,
        positionX: 50,
        positionY: Math.min(80, 40 + prev.length * 10),
      },
    ]);
  };

  // Handler for removing a text element
  const handleRemoveText = (textId) => {
    setTexts((prev) => {
      const filtered = prev.filter((item) => item.id !== textId);
      if (filtered.length === 0) {
        return [
          {
            id: `text-${Date.now()}`,
            text: "",
            fontFamily: "Inter",
            textColor: "#000000",
            fontSize: 24,
            scale: 1,
            rotation: 0,
            positionX: 50,
            positionY: 50,
          },
        ];
      }
      return filtered;
    });
  };

  // Handler for updating a text element field
  const updateTextItem = (textId, field, value) => {
    setTexts((prev) =>
      prev.map((item) => (item.id === textId ? { ...item, [field]: value } : item))
    );
  };

  // Handler for adding dynamic user design item
  const handleAddUserDesign = () => {
    const newId = `design-${Date.now()}`;
    setUserDesigns((prev) => [
      ...prev,
      {
        id: newId,
        file: null,
        preview: "",
        scale: 1,
        rotation: 0,
        positionX: 50,
        positionY: Math.min(75, 30 + prev.length * 10),
      },
    ]);
  };

  // Handler for selecting an image file for a user design item
  const handleUserDesignFileSelect = (event, id) => {
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

    setUserDesigns((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          if (item.preview) URL.revokeObjectURL(item.preview);
          return { ...item, file, preview: newPreview };
        }
        return item;
      })
    );

    setUserDesignError("");
  };

  // Handler for removing a user design item
  const handleRemoveUserDesignItem = (id) => {
    setUserDesigns((prev) => {
      const itemToRemove = prev.find((item) => item.id === id);
      if (itemToRemove && itemToRemove.preview) {
        URL.revokeObjectURL(itemToRemove.preview);
      }
      const filtered = prev.filter((item) => item.id !== id);
      if (filtered.length === 0) {
        return [
          {
            id: `design-${Date.now()}`,
            file: null,
            preview: "",
            scale: 1,
            rotation: 0,
            positionX: 50,
            positionY: 35,
          },
        ];
      }
      return filtered;
    });
    setUserDesignError("");
  };

  // Handler for updating a user design item field
  const updateUserDesignItem = (id, field, value) => {
    setUserDesigns((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const selectAdminDesignAsActive = (design) => {
    setSelectedDesign(design);
  };

  const loadData = async () => {
    try {
      setLoading(true);

      const [productResponse, designResponse] = await Promise.all([
        productService.getProductById(id),
        designService.getDesigns(),
      ]);

      const productData = productResponse?.product;

      if (!productData) {
        throw new Error("Product not found.");
      }

      if (!productData.customizable) {
        throw new Error("This product cannot be customized.");
      }

      setProduct(productData);
      setDesigns(designResponse?.designs || []);

      const variants = Array.isArray(productData.variants)
        ? productData.variants
        : [];

      const availableColors = variants
        .map((variant) => variant?.color?.trim())
        .filter(Boolean);

      const passedSize = location.state?.size;

      if (passedSize && productData.sizes?.includes(passedSize)) {
        setSelectedSize(passedSize);
      } else {
        setSelectedSize(productData.sizes?.[0] || "");
      }

      const passedColor = location.state?.color?.trim();

      if (passedColor) {
        const matchedColor = availableColors.find(
          (color) => color.toLowerCase() === passedColor.toLowerCase()
        );

        if (matchedColor) {
          setSelectedColor(matchedColor);
        } else if (availableColors.length > 0) {
          setSelectedColor(availableColors[0]);
        } else {
          setSelectedColor("");
        }
      } else if (availableColors.length > 0) {
        setSelectedColor(availableColors[0]);
      } else {
        setSelectedColor("");
      }
    } catch (error) {
      console.error("Failed to load customizer:", error);

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

  const selectedVariant = product?.variants?.find(
    (variant) =>
      variant?.color?.trim().toLowerCase() ===
      selectedColor?.trim().toLowerCase()
  );

  const previewImage =
    selectedColor && selectedVariant?.image
      ? selectedVariant.image
      : product?.images?.[0] ||
        product?.variants?.[0]?.image ||
        "";

  const availableColors = Array.isArray(product?.variants)
    ? product.variants.map((variant) => variant?.color?.trim()).filter(Boolean)
    : [];

  const updateAdminDesignPosition = (field, value) => {
    setAdminDesignPosition((current) => ({
      ...current,
      [field]: Number(value),
    }));
  };

  const uploadedFilesCount = userDesigns.filter((ud) => ud.file).length;
  let activeDesignName = "None";
  const parts = [];
  if (uploadedFilesCount > 0) {
    parts.push(
      `${uploadedFilesCount} Custom ${
        uploadedFilesCount === 1 ? "Upload" : "Uploads"
      }`
    );
  }
  if (selectedDesign) {
    parts.push(selectedDesign.name || "Admin Design");
  }
  if (parts.length > 0) {
    activeDesignName = parts.join(" + ");
  }

  const handleSaveAndAddToCart = async () => {
    const productId = product?._id || id;
    const size = selectedSize || product?.sizes?.[0] || "";
    const color = selectedColor || availableColors?.[0] || "";

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

    const hasText = texts.some((t) => t.text.trim().length > 0);
    const uploadedItemsWithFile = userDesigns.filter((ud) => ud.file !== null);
    const hasUserDesign = uploadedItemsWithFile.length > 0;
    const hasAdminDesign = Boolean(selectedDesign);

    if (!hasText && !hasUserDesign && !hasAdminDesign) {
      showNotification(
        "Please add text, select a design, or upload your design.",
        "warning"
      );
      return;
    }

    try {
      setSaving(true);

      const validTexts = texts.filter((t) => t.text.trim().length > 0);
      const firstTextObj = validTexts[0] || texts[0] || {};

      let customizationData;

      if (hasUserDesign) {
        const formData = new FormData();
        formData.append("product", productId);
        formData.append("size", size);
        formData.append("color", color);

        // Multiple text support
        formData.append("texts", JSON.stringify(texts));
        formData.append("text", firstTextObj.text ? firstTextObj.text.trim() : "");
        formData.append("fontFamily", firstTextObj.fontFamily || "Inter");
        formData.append("textColor", firstTextObj.textColor || "#000000");
        formData.append(
          "textPosition",
          JSON.stringify({
            x: Number(firstTextObj.positionX || 50),
            y: Number(firstTextObj.positionY || 50),
          })
        );
        formData.append("textSize", Number(firstTextObj.fontSize || 24));
        formData.append("textScale", Number(firstTextObj.scale || 1));
        formData.append("textRotation", Number(firstTextObj.rotation || 0));

        // Multiple user designs metadata & file uploads
        const userDesignsMeta = uploadedItemsWithFile.map((ud, idx) => ({
          id: ud.id,
          fieldName: `userDesignFile_${idx}`,
          userDesignPosition: {
            x: Number(ud.positionX),
            y: Number(ud.positionY),
          },
          userDesignScale: Number(ud.scale),
          userDesignRotation: Number(ud.rotation),
        }));

        formData.append("userDesignsMeta", JSON.stringify(userDesignsMeta));

        uploadedItemsWithFile.forEach((ud, idx) => {
          formData.append(`userDesignFile_${idx}`, ud.file);
        });

        // First uploaded file as userDesign for single-file compatibility
        if (uploadedItemsWithFile[0]) {
          formData.append("userDesign", uploadedItemsWithFile[0].file);
          formData.append(
            "userDesignPosition",
            JSON.stringify({
              x: Number(uploadedItemsWithFile[0].positionX),
              y: Number(uploadedItemsWithFile[0].positionY),
            })
          );
          formData.append(
            "userDesignScale",
            Number(uploadedItemsWithFile[0].scale)
          );
        }

        if (selectedDesign?._id) {
          formData.append("design", selectedDesign._id);
        }

        formData.append(
          "adminDesignPosition",
          JSON.stringify({
            x: Number(adminDesignPosition.x),
            y: Number(adminDesignPosition.y),
          })
        );
        formData.append("adminDesignScale", Number(adminDesignScale));
        formData.append(
          "designPosition",
          JSON.stringify({
            x: Number(adminDesignPosition.x),
            y: Number(adminDesignPosition.y),
          })
        );
        formData.append(
          "designSize",
          JSON.stringify({ width: 100, height: 100 })
        );
        formData.append("designScale", Number(adminDesignScale));
        formData.append("designRotation", Number(0));

        customizationData = formData;
      } else {
        customizationData = {
          product: productId,
          size,
          color,
          texts,
          text: firstTextObj.text ? firstTextObj.text.trim() : "",
          fontFamily: firstTextObj.fontFamily || "Inter",
          textColor: firstTextObj.textColor || "#000000",
          textPosition: {
            x: Number(firstTextObj.positionX || 50),
            y: Number(firstTextObj.positionY || 50),
          },
          textSize: Number(firstTextObj.fontSize || 24),
          textScale: Number(firstTextObj.scale || 1),
          textRotation: Number(firstTextObj.rotation || 0),
          design: selectedDesign?._id || null,
          adminDesignPosition: {
            x: Number(adminDesignPosition.x),
            y: Number(adminDesignPosition.y),
          },
          adminDesignScale: Number(adminDesignScale),
          designPosition: {
            x: Number(adminDesignPosition.x),
            y: Number(adminDesignPosition.y),
          },
          designSize: {
            width: 100,
            height: 100,
          },
          designScale: Number(adminDesignScale),
          designRotation: 0,
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
              Choose your size and color, then add multiple text elements or
              designs to create your custom T-shirt.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Left Column: T-Shirt Canvas Preview (Sticky on Mobile & Desktop) */}
          <section className="sticky top-0 z-30 bg-white shadow-md sm:shadow-none lg:top-6 lg:self-start">
            <div className="border border-gray-200 bg-white">
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2.5 sm:px-5 sm:py-4">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 sm:text-base">
                    Live Preview
                  </h2>

                  <p className="hidden text-xs text-gray-500 sm:block sm:mt-1">
                    See how your designs and text look on the T-shirt.
                  </p>
                </div>

                <span className="text-sm font-semibold text-gray-900 sm:text-base">
                  ₹{Number(product.price || 0).toLocaleString("en-IN")}
                </span>
              </div>

              <div className="bg-gray-100 p-2 sm:p-8">
                <div className="mx-auto flex aspect-square w-full max-w-[220px] xs:max-w-[260px] sm:max-w-xl items-center justify-center">
                  <div className="relative aspect-square w-full max-w-[200px] xs:max-w-[240px] sm:max-w-md overflow-hidden bg-white shadow-sm">
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

                    {/* Render User Uploaded Designs */}
                    {userDesigns.map((ud) =>
                      ud.preview ? (
                        <img
                          key={ud.id}
                          src={ud.preview}
                          alt="Uploaded Design"
                          className="absolute h-auto max-w-[35%] object-contain"
                          style={{
                            left: `${ud.positionX}%`,
                            top: `${ud.positionY}%`,
                            transform:
                              `translate(-50%, -50%) ` +
                              `scale(${ud.scale}) ` +
                              `rotate(${ud.rotation || 0}deg)`,
                          }}
                        />
                      ) : null
                    )}

                    {/* Render Predefined Admin Design */}
                    {selectedDesign && (
                      <img
                        src={
                          selectedDesign.image || selectedDesign.imageUrl
                        }
                        alt={selectedDesign.name || "Design"}
                        className="absolute h-auto max-w-[35%] object-contain"
                        style={{
                          left: `${adminDesignPosition.x}%`,
                          top: `${adminDesignPosition.y}%`,
                          transform:
                            `translate(-50%, -50%) ` +
                            `scale(${adminDesignScale})`,
                        }}
                      />
                    )}

                    {/* Render Multiple Text Elements */}
                    {texts.map((t) =>
                      t.text ? (
                        <div
                          key={t.id}
                          className="absolute whitespace-nowrap font-bold"
                          style={{
                            left: `${t.positionX}%`,
                            top: `${t.positionY}%`,
                            color: t.textColor,
                            fontSize: `${t.fontSize}px`,
                            fontFamily: t.fontFamily || "Inter",
                            transform:
                              `translate(-50%, -50%) ` +
                              `scale(${t.scale || 1}) ` +
                              `rotate(${t.rotation || 0}deg)`,
                          }}
                        >
                          {t.text}
                        </div>
                      ) : null
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 border-t border-gray-200 text-center sm:text-left">
                <div className="border-r border-gray-200 px-2 py-1.5 sm:p-4">
                  <p className="text-[10px] text-gray-400 sm:text-xs">Size</p>

                  <p className="mt-0.5 truncate text-xs font-semibold text-gray-900 sm:mt-1 sm:text-sm">
                    {selectedSize || "-"}
                  </p>
                </div>

                <div className="border-r border-gray-200 px-2 py-1.5 sm:p-4">
                  <p className="text-[10px] text-gray-400 sm:text-xs">Color</p>

                  <p className="mt-0.5 truncate text-xs font-semibold text-gray-900 sm:mt-1 sm:text-sm">
                    {selectedColor || "-"}
                  </p>
                </div>

                <div className="px-2 py-1.5 sm:p-4">
                  <p className="text-[10px] text-gray-400 sm:text-xs">Design</p>

                  <p className="mt-0.5 truncate text-xs font-semibold text-gray-900 sm:mt-1 sm:text-sm">
                    {activeDesignName}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Right Column: Customizer Controls */}
          <div className="space-y-6">
            {/* Product Options */}
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

            {/* Dynamic Text Elements Section */}
            <section className="border border-gray-200 bg-white">
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                <h2 className="text-base font-semibold text-gray-900">
                  Add Text
                </h2>

                <button
                  type="button"
                  onClick={handleAddText}
                  className="border border-black bg-black px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-gray-800"
                >
                  + Add Text
                </button>
              </div>

              <div className="divide-y divide-gray-200 p-5">
                {texts.map((item, index) => (
                  <div key={item.id} className={index > 0 ? "pt-6 mt-6" : ""}>
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-gray-700">
                        Text {index + 1}
                      </span>

                      {texts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveText(item.id)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <label className="block">
                      <span className="mb-1.5 block text-xs font-medium text-gray-800">
                        Content
                      </span>
                      <input
                        type="text"
                        value={item.text}
                        maxLength={100}
                        onChange={(e) =>
                          updateTextItem(item.id, "text", e.target.value)
                        }
                        placeholder="Enter your text"
                        className="h-10 w-full border border-gray-300 px-3 text-sm outline-none focus:border-black"
                      />
                    </label>

                    <div className="mt-4 grid grid-cols-2 gap-4">
                      {/* Font Family Selector */}
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-gray-800">
                          Font
                        </label>
                        <select
                          value={item.fontFamily || "Inter"}
                          onChange={(e) =>
                            updateTextItem(item.id, "fontFamily", e.target.value)
                          }
                          className="h-10 w-full border border-gray-300 bg-white px-2.5 text-sm outline-none focus:border-black"
                        >
                          {FONT_OPTIONS.map((font) => (
                            <option key={font} value={font} style={{ fontFamily: font }}>
                              {font}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Text Color Picker */}
                      <div>
                        <div className="mb-1.5 flex items-center justify-between text-xs">
                          <span className="font-medium text-gray-800">Color</span>
                          <span className="text-gray-500">{item.textColor}</span>
                        </div>
                        <input
                          type="color"
                          value={item.textColor || "#000000"}
                          onChange={(e) =>
                            updateTextItem(item.id, "textColor", e.target.value)
                          }
                          className="h-10 w-full cursor-pointer border border-gray-300 bg-white p-1"
                        />
                      </div>
                    </div>

                    {/* Font Size & Rotation Sliders */}
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div>
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="font-medium text-gray-800">Font Size</span>
                          <span className="text-gray-500">{item.fontSize}px</span>
                        </div>
                        <input
                          type="range"
                          min="12"
                          max="60"
                          value={item.fontSize}
                          onChange={(e) =>
                            updateTextItem(item.id, "fontSize", Number(e.target.value))
                          }
                          className="w-full"
                        />
                      </div>

                      <div>
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="font-medium text-gray-800">Rotation</span>
                          <span className="text-gray-500">{item.rotation}°</span>
                        </div>
                        <input
                          type="range"
                          min="-180"
                          max="180"
                          value={item.rotation}
                          onChange={(e) =>
                            updateTextItem(item.id, "rotation", Number(e.target.value))
                          }
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Position Sliders */}
                    <div className="mt-4">
                      <p className="mb-2 text-xs font-medium text-gray-800">
                        Position Controls
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="mb-1 flex justify-between text-xs">
                            <span className="text-gray-600">Horizontal</span>
                            <span className="text-gray-500">{item.positionX}</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={item.positionX}
                            onChange={(e) =>
                              updateTextItem(item.id, "positionX", Number(e.target.value))
                            }
                            className="w-full"
                          />
                        </div>

                        <div>
                          <div className="mb-1 flex justify-between text-xs">
                            <span className="text-gray-600">Vertical</span>
                            <span className="text-gray-500">{item.positionY}</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={item.positionY}
                            onChange={(e) =>
                              updateTextItem(item.id, "positionY", Number(e.target.value))
                            }
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Dynamic Design Uploads Section */}
            <section className="border border-gray-200 bg-white">
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    Upload Your Design
                  </h2>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Upload personal designs (PNG, JPG or WEBP • Max 5 MB).
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddUserDesign}
                  className="border border-black bg-black px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-gray-800"
                >
                  + Add More
                </button>
              </div>

              <div className="p-5">
                {userDesignError && (
                  <div className="mb-4 text-xs font-medium text-red-600">
                    {userDesignError}
                  </div>
                )}

                <div className="space-y-6 divide-y divide-gray-200">
                  {userDesigns.map((item, index) => (
                    <div key={item.id} className={index > 0 ? "pt-6" : ""}>
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-900">
                          Design {index + 1}
                        </span>

                        {userDesigns.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveUserDesignItem(item.id)}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      {item.preview ? (
                        <div className="border border-gray-200 bg-gray-50/50 p-4">
                          <div className="flex items-center gap-4">
                            <div className="h-16 w-16 shrink-0 overflow-hidden border border-gray-200 bg-white p-1">
                              <img
                                src={item.preview}
                                alt={`Design ${index + 1} Preview`}
                                className="h-full w-full object-contain"
                              />
                            </div>

                            <div className="min-w-0 flex-1 text-xs">
                              <p className="truncate font-medium text-gray-900">
                                {item.file?.name || "Uploaded Image"}
                              </p>
                              {item.file && (
                                <p className="mt-0.5 text-gray-500">
                                  {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-3">
                              <label className="cursor-pointer text-xs font-medium text-black hover:underline">
                                Replace
                                <input
                                  type="file"
                                  accept="image/png, image/jpeg, image/jpg, image/webp"
                                  onChange={(e) => handleUserDesignFileSelect(e, item.id)}
                                  className="hidden"
                                />
                              </label>

                              <button
                                type="button"
                                onClick={() => handleRemoveUserDesignItem(item.id)}
                                className="text-xs text-red-600 hover:underline"
                              >
                                Remove
                              </button>
                            </div>
                          </div>

                          {/* Item Customization Controls */}
                          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4">
                            <div>
                              <div className="mb-1 flex justify-between text-xs">
                                <span className="font-medium text-gray-800">Size</span>
                                <span className="text-gray-500">{item.scale}x</span>
                              </div>
                              <input
                                type="range"
                                min="0.2"
                                max="3.0"
                                step="0.1"
                                value={item.scale}
                                onChange={(e) =>
                                  updateUserDesignItem(item.id, "scale", Number(e.target.value))
                                }
                                className="w-full"
                              />
                            </div>

                            <div>
                              <div className="mb-1 flex justify-between text-xs">
                                <span className="font-medium text-gray-800">Rotation</span>
                                <span className="text-gray-500">{item.rotation}°</span>
                              </div>
                              <input
                                type="range"
                                min="-180"
                                max="180"
                                value={item.rotation}
                                onChange={(e) =>
                                  updateUserDesignItem(item.id, "rotation", Number(e.target.value))
                                }
                                className="w-full"
                              />
                            </div>
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-4">
                            <div>
                              <div className="mb-1 flex justify-between text-xs">
                                <span className="text-gray-600">Horizontal</span>
                                <span className="text-gray-500">{item.positionX}</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={item.positionX}
                                onChange={(e) =>
                                  updateUserDesignItem(item.id, "positionX", Number(e.target.value))
                                }
                                className="w-full"
                              />
                            </div>

                            <div>
                              <div className="mb-1 flex justify-between text-xs">
                                <span className="text-gray-600">Vertical</span>
                                <span className="text-gray-500">{item.positionY}</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={item.positionY}
                                onChange={(e) =>
                                  updateUserDesignItem(item.id, "positionY", Number(e.target.value))
                                }
                                className="w-full"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <label className="flex cursor-pointer flex-col items-center justify-center border border-dashed border-gray-300 py-6 text-center hover:border-gray-400">
                          <span className="border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-medium text-gray-800 hover:bg-gray-100">
                            Choose Image
                          </span>
                          <input
                            type="file"
                            accept="image/png, image/jpeg, image/jpg, image/webp"
                            onChange={(e) => handleUserDesignFileSelect(e, item.id)}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Choose Predefined Admin Design Section */}
            <section className="border border-gray-200 bg-white">
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    Choose a Design
                  </h2>

                  <p className="mt-1 text-xs text-gray-500">
                    Select a predefined design to add to your T-shirt.
                  </p>
                </div>

                {selectedDesign && (
                  <button
                    type="button"
                    onClick={() => setSelectedDesign(null)}
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
                      const isSelected = selectedDesign?._id === design._id;

                      return (
                        <button
                          key={design._id}
                          type="button"
                          onClick={() => selectAdminDesignAsActive(design)}
                          className={`border p-2 text-left transition-all ${
                            isSelected
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

                {/* Admin Design Controls */}
                {selectedDesign && (
                  <div className="mt-6 border-t border-gray-200 pt-5">
                    <div className="border border-gray-200 bg-gray-50/50 p-4">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-700">
                        Admin Design Controls ({selectedDesign.name || "Selected"})
                      </p>

                      <div>
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="font-medium text-gray-800">Size</span>
                          <span className="text-gray-500">{adminDesignScale}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.2"
                          max="3.0"
                          step="0.1"
                          value={adminDesignScale}
                          onChange={(event) =>
                            setAdminDesignScale(Number(event.target.value))
                          }
                          className="w-full"
                        />
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div>
                          <div className="mb-1 flex justify-between text-xs">
                            <span className="text-gray-600">Horizontal</span>
                            <span className="text-gray-500">{adminDesignPosition.x}</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={adminDesignPosition.x}
                            onChange={(event) =>
                              updateAdminDesignPosition("x", event.target.value)
                            }
                            className="w-full"
                          />
                        </div>

                        <div>
                          <div className="mb-1 flex justify-between text-xs">
                            <span className="text-gray-600">Vertical</span>
                            <span className="text-gray-500">{adminDesignPosition.y}</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={adminDesignPosition.y}
                            onChange={(event) =>
                              updateAdminDesignPosition("y", event.target.value)
                            }
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Save & Add to Cart Section */}
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