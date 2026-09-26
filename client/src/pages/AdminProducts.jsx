import { useEffect, useRef, useState } from "react";

import Loader from "../components/Loader";
import productService from "../services/productService";
import categoryService from "../services/categoryService";

const availableSizes = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
];

const availableColors = [
  "Black",
  "White",
  "Red",
  "Blue",
  "Green",
  "Yellow",
  "Grey",
  "Navy",
  "Cream",
  "Olive",
  "Beige",
];

const initialForm = {
  name: "",
  description: "",
  price: "",
  category: "",
  sizes: [],
  variants: [],
  stock: "",
  customizable: true,
};

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState(initialForm);

  const fileInputRefs = useRef({});

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [productResponse, categoryResponse] =
        await Promise.all([
          productService.getProducts(),
          categoryService.getCategories(),
        ]);

      setProducts(productResponse.products || []);
      setCategories(categoryResponse.categories || []);
    } catch (error) {
      console.error(
        "Failed to load admin products:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to load products."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const toggleSize = (size) => {
    setForm((current) => {
      const exists =
        current.sizes.includes(size);

      return {
        ...current,
        sizes: exists
          ? current.sizes.filter(
              (item) => item !== size
            )
          : [...current.sizes, size],
      };
    });
  };

  const toggleColor = (color) => {
    setForm((current) => {
      const exists =
        current.variants.some(
          (variant) =>
            variant.color === color
        );

      if (exists) {
        return {
          ...current,
          variants:
            current.variants.filter(
              (variant) =>
                variant.color !== color
            ),
        };
      }

      return {
        ...current,
        variants: [
          ...current.variants,
          {
            color,
            file: null,
            existingImage: "",
          },
        ],
      };
    });

    setError("");
  };

  const handleVariantImageChange = (
    color,
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError(
        "Only image files are allowed."
      );

      event.target.value = "";
      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      setError(
        "Each image must be smaller than 5 MB."
      );

      event.target.value = "";
      return;
    }

    setError("");

    setForm((current) => ({
      ...current,
      variants:
        current.variants.map(
          (variant) =>
            variant.color === color
              ? {
                  ...variant,
                  file,
                }
              : variant
        ),
    }));
  };

  const removeVariantImage = (
    color
  ) => {
    setForm((current) => ({
      ...current,
      variants:
        current.variants.map(
          (variant) =>
            variant.color === color
              ? {
                  ...variant,
                  file: null,
                  existingImage: "",
                }
              : variant
        ),
    }));

    const input =
      fileInputRefs.current[color];

    if (input) {
      input.value = "";
    }
  };

  const resetForm = () => {
    setForm({
      ...initialForm,
      sizes: [],
      variants: [],
    });

    setEditingId(null);
    setShowForm(false);
    setError("");

    fileInputRefs.current = {};
  };

  const validateVariants = () => {
    if (form.variants.length === 0) {
      return "Please select at least one color.";
    }

    for (const variant of form.variants) {
      const hasNewImage =
        Boolean(variant.file);

      const hasExistingImage =
        Boolean(
          variant.existingImage
        );

      if (
        !hasNewImage &&
        !hasExistingImage
      ) {
        return `Please upload an image for ${variant.color}.`;
      }
    }

    return "";
  };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    const variantError =
      validateVariants();

    if (variantError) {
      setError(variantError);
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const formData = new FormData();

      formData.append(
        "name",
        form.name.trim()
      );

      formData.append(
        "description",
        form.description.trim()
      );

      formData.append(
        "price",
        Number(form.price)
      );

      formData.append(
        "category",
        form.category.trim()
      );

      formData.append(
        "stock",
        Number(form.stock)
      );

      formData.append(
        "customizable",
        form.customizable
      );

      form.sizes.forEach((size) => {
        formData.append(
          "sizes",
          size
        );
      });

      const variantMetadata = [];

      let imageIndex = 0;

      form.variants.forEach(
        (variant) => {
          const metadata = {
            color: variant.color,
          };

          if (variant.file) {
            metadata.imageIndex =
              imageIndex;

            formData.append(
              "variantImages",
              variant.file
            );

            imageIndex += 1;
          } else if (
            variant.existingImage
          ) {
            metadata.image =
              variant.existingImage;
          }

          variantMetadata.push(
            metadata
          );
        }
      );

      formData.append(
        "variants",
        JSON.stringify(
          variantMetadata
        )
      );

      if (editingId) {
        await productService.updateProduct(
          editingId,
          formData
        );

        setMessage(
          "Product updated successfully."
        );
      } else {
        await productService.createProduct(
          formData
        );

        setMessage(
          "Product created successfully."
        );
      }

      resetForm();

      await loadData();
    } catch (error) {
      console.error(
        "Save product error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to save product."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (
    product
  ) => {
    const productVariants =
      Array.isArray(
        product.variants
      )
        ? product.variants.map(
            (variant) => ({
              color:
                variant.color,
              file: null,
              existingImage:
                variant.image || "",
            })
          )
        : [];

    setEditingId(
      product._id
    );

    setForm({
      name: product.name || "",

      description:
        product.description || "",

      price:
        product.price ?? "",

      category:
        product.category || "",

      sizes:
        product.sizes || [],

      variants:
        productVariants,

      stock:
        product.stock ?? "",

      customizable:
        product.customizable ??
        true,
    });

    setError("");
    setMessage("");

    fileInputRefs.current = {};

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (
    productId
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this product?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setMessage("");

      await productService.deleteProduct(
        productId
      );

      setMessage(
        "Product deleted successfully."
      );

      await loadData();
    } catch (error) {
      console.error(
        "Delete product error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to delete product."
      );
    }
  };

  if (loading) {
    return (
      <Loader text="Loading products..." />
    );
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Products
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Create and manage your T-shirt
            products.
          </p>
        </div>

        {!showForm && (
          <button
            type="button"
            onClick={() => {
              setForm({
                ...initialForm,
                sizes: [],
                variants: [],
              });

              setEditingId(null);
              setError("");
              setMessage("");
              setShowForm(true);
            }}
            className="bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            + Add Product
          </button>
        )}
      </div>

      {error && (
        <div className="mb-5 border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {message && (
        <div className="mb-5 border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {message}
        </div>
      )}

      {showForm && (
        <section className="mb-8 border bg-white p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {editingId
                  ? "Edit Product"
                  : "Add Product"}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Enter the product information
                and assign an image to each
                color.
              </p>
            </div>

            <button
              type="button"
              onClick={resetForm}
              disabled={saving}
              className="text-sm text-gray-500 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Product Name
                </label>

                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Classic T-Shirt"
                  className="w-full border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Category
                </label>

                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 px-4 py-3 outline-none focus:border-black"
                >
                  <option value="">
                    Select Category
                  </option>

                  {categories.map(
                    (category) => (
                      <option
                        key={category._id}
                        value={
                          category.name
                        }
                      >
                        {category.name}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Price
                </label>

                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  min="0"
                  required
                  placeholder="799"
                  className="w-full border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Stock
                </label>

                <input
                  type="number"
                  name="stock"
                  value={form.stock}
                  onChange={handleChange}
                  min="0"
                  required
                  placeholder="50"
                  className="w-full border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Description
              </label>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                required
                rows={4}
                placeholder="Describe the product..."
                className="w-full border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium">
                Available Sizes
              </label>

              <div className="flex flex-wrap gap-2">
                {availableSizes.map(
                  (size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() =>
                        toggleSize(
                          size
                        )
                      }
                      className={`border px-4 py-2 text-sm font-medium ${
                        form.sizes.includes(
                          size
                        )
                          ? "border-black bg-black text-white"
                          : "border-gray-300 hover:border-black"
                      }`}
                    >
                      {size}
                    </button>
                  )
                )}
              </div>
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium">
                Available Colors
              </label>

              <div className="flex flex-wrap gap-2">
                {availableColors.map(
                  (color) => {
                    const selected =
                      form.variants.some(
                        (variant) =>
                          variant.color ===
                          color
                      );

                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() =>
                          toggleColor(
                            color
                          )
                        }
                        className={`border px-4 py-2 text-sm font-medium ${
                          selected
                            ? "border-black bg-black text-white"
                            : "border-gray-300 hover:border-black"
                        }`}
                      >
                        {color}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {form.variants.length >
              0 && (
              <div>
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Color Images
                  </h3>

                  <p className="mt-1 text-xs text-gray-500">
                    Upload one image for
                    each selected color.
                    Maximum 5 MB per image.
                  </p>
                </div>

                <div className="space-y-4">
                  {form.variants.map(
                    (variant) => (
                      <div
                        key={
                          variant.color
                        }
                        className="border border-gray-200 p-4"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                          <div className="w-full sm:w-28">
                            <p className="text-sm font-semibold text-gray-900">
                              {
                                variant.color
                              }
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              Color variant
                            </p>
                          </div>

                          <div className="h-28 w-28 shrink-0 overflow-hidden border bg-gray-50">
                            {variant.file ? (
                              <img
                                src={URL.createObjectURL(
                                  variant.file
                                )}
                                alt={`${variant.color} preview`}
                                className="h-full w-full object-cover"
                              />
                            ) : variant.existingImage ? (
                              <img
                                src={
                                  variant.existingImage
                                }
                                alt={`${variant.color} product`}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center px-2 text-center text-xs text-gray-400">
                                No image
                              </div>
                            )}
                          </div>

                          <div className="flex-1">
                            <input
                              ref={(element) => {
                                fileInputRefs.current[
                                  variant.color
                                ] =
                                  element;
                              }}
                              type="file"
                              accept="image/*"
                              onChange={(
                                event
                              ) =>
                                handleVariantImageChange(
                                  variant.color,
                                  event
                                )
                              }
                              disabled={
                                saving
                              }
                              className="block w-full border border-gray-300 p-3 text-sm"
                            />

                            <p className="mt-2 text-xs text-gray-500">
                              {variant.file
                                ? variant
                                    .file
                                    .name
                                : variant.existingImage
                                  ? "Existing image will be kept unless replaced."
                                  : "Please select an image."}
                            </p>
                          </div>

                          {(variant.file ||
                            variant.existingImage) && (
                            <button
                              type="button"
                              onClick={() =>
                                removeVariantImage(
                                  variant.color
                                )
                              }
                              disabled={
                                saving
                              }
                              className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={
                  form.customizable
                }
                onChange={(event) =>
                  setForm(
                    (current) => ({
                      ...current,
                      customizable:
                        event.target
                          .checked,
                    })
                  )
                }
                className="h-4 w-4"
              />

              <span className="text-sm font-medium">
                Allow T-shirt
                customization
              </span>
            </label>

            <button
              type="submit"
              disabled={saving}
              className="bg-black px-6 py-3 font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {saving
                ? "Uploading..."
                : editingId
                  ? "Update Product"
                  : "Create Product"}
            </button>
          </form>
        </section>
      )}

      <section className="border bg-white">
        <div className="border-b p-5">
          <h2 className="font-bold text-gray-900">
            Product List
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {products.length} product
            {products.length !== 1
              ? "s"
              : ""}
          </p>
        </div>

        {products.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            No products found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-212.5 text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-5 py-3 font-medium">
                    Product
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Category
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Price
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Stock
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Colors
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Customizable
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {products.map(
                  (product) => {
                    const variants =
                      Array.isArray(
                        product.variants
                      )
                        ? product.variants
                        : [];

                    return (
                      <tr
                        key={
                          product._id
                        }
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 overflow-hidden bg-gray-100">
                              {variants[0]
                                ?.image ? (
                                <img
                                  src={
                                    variants[0]
                                      .image
                                  }
                                  alt={
                                    product.name
                                  }
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-xs text-gray-400">
                                  No image
                                </div>
                              )}
                            </div>

                            <div>
                              <p className="font-semibold text-gray-900">
                                {
                                  product.name
                                }
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          {
                            product.category
                          }
                        </td>

                        <td className="px-5 py-4 font-medium">
                          ₹
                          {
                            product.price
                          }
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={
                              product.stock >
                              0
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {
                              product.stock
                            }
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1">
                            {variants.length >
                            0 ? (
                              variants.map(
                                (
                                  variant
                                ) => (
                                  <span
                                    key={
                                      variant.color
                                    }
                                    className="border border-gray-200 px-2 py-1 text-xs"
                                  >
                                    {
                                      variant.color
                                    }
                                  </span>
                                )
                              )
                            ) : (
                              <span className="text-gray-400">
                                —
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          {product.customizable
                            ? "Yes"
                            : "No"}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                handleEdit(
                                  product
                                )
                              }
                              className="font-medium text-blue-600 hover:text-blue-700"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  product._id
                                )
                              }
                              className="font-medium text-red-600 hover:text-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminProducts;