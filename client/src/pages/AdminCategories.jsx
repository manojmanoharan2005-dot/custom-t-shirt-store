import { useEffect, useState } from "react";

import Loader from "../components/Loader";
import categoryService from "../services/categoryService";

const initialForm = {
  name: "",
  description: "",
  image: null,
};

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  const [imagePreview, setImagePreview] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await categoryService.getCategories();

      setCategories(response?.categories || []);
    } catch (error) {
      console.error(
        "Failed to load categories:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to load categories."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        "Image size must be less than 5 MB."
      );
      return;
    }

    setError("");

    setForm((current) => ({
      ...current,
      image: file,
    }));

    setImagePreview(
      URL.createObjectURL(file)
    );
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setImagePreview("");
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

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

      if (form.image) {
        formData.append(
          "image",
          form.image
        );
      }

      if (editingId) {
        await categoryService.updateCategory(
          editingId,
          formData
        );

        setMessage(
          "Category updated successfully."
        );
      } else {
        await categoryService.createCategory(
          formData
        );

        setMessage(
          "Category created successfully."
        );
      }

      resetForm();

      await loadCategories();
    } catch (error) {
      console.error(
        "Save category error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to save category."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (category) => {
    setEditingId(category._id);

    setForm({
      name: category.name || "",
      description:
        category.description || "",
      image: null,
    });

    const existingImage =
      category.image ||
      category.imageUrl ||
      category.image_url ||
      "";

    setImagePreview(existingImage);

    setError("");
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (categoryId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this category?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setMessage("");

      await categoryService.deleteCategory(
        categoryId
      );

      setMessage(
        "Category deleted successfully."
      );

      await loadCategories();
    } catch (error) {
      console.error(
        "Delete category error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to delete category."
      );
    }
  };

  const handleRemoveImage = () => {
    setForm((current) => ({
      ...current,
      image: null,
    }));

    setImagePreview("");
  };

  const getCategoryImage = (category) => {
    return (
      category?.image ||
      category?.imageUrl ||
      category?.image_url ||
      null
    );
  };

  if (loading) {
    return (
      <Loader text="Loading categories..." />
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Categories
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Create and manage product categories.
        </p>
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

      <div className="grid gap-8 lg:grid-cols-3">
        <section className="h-fit border bg-white p-6">
          <h2 className="text-lg font-bold text-gray-900">
            {editingId
              ? "Edit Category"
              : "Add Category"}
          </h2>

          <form
            onSubmit={handleSubmit}
            className="mt-5 space-y-5"
          >
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Category Name
              </label>

              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="e.g. Oversized"
                className="w-full border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Description
              </label>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                placeholder="Category description..."
                className="w-full border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Category Image
              </label>

              <div className="border border-dashed border-gray-300 p-4">
                {imagePreview ? (
                  <div>
                    <div className="flex justify-center bg-gray-50 p-3">
                      <img
                        src={imagePreview}
                        alt="Category preview"
                        className="h-40 w-40 rounded-full object-cover"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      disabled={saving}
                      className="mt-3 w-full border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Remove Image
                    </button>
                  </div>
                ) : (
                  <div className="flex h-40 items-center justify-center rounded-full bg-gray-100">
                    <span className="text-xs uppercase tracking-[0.2em] text-gray-400">
                      No Image
                    </span>
                  </div>
                )}

                <label className="mt-4 block cursor-pointer">
                  <span className="flex w-full items-center justify-center border border-black px-4 py-3 text-sm font-medium text-black transition hover:bg-black hover:text-white">
                    {imagePreview
                      ? "Change Image"
                      : "Choose Image"}
                  </span>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>

                <p className="mt-2 text-center text-xs text-gray-400">
                  JPG, PNG, WEBP · Maximum 5 MB
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-black px-5 py-3 font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
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
                  disabled={saving}
                  className="border border-gray-300 px-5 py-3 font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="border bg-white lg:col-span-2">
          <div className="border-b p-5">
            <h2 className="font-bold text-gray-900">
              Category List
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {categories.length} categor
              {categories.length !== 1
                ? "ies"
                : "y"}
            </p>
          </div>

          {categories.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              No categories found.
            </div>
          ) : (
            <div className="divide-y">
              {categories.map((category) => {
                const categoryImage =
                  getCategoryImage(category);

                return (
                  <div
                    key={category._id}
                    className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-gray-100">
                        {categoryImage ? (
                          <img
                            src={categoryImage}
                            alt={category.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <span className="px-2 text-center text-[8px] font-semibold uppercase tracking-wider text-gray-400">
                              No Image
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900">
                          {category.name}
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                          {category.description ||
                            "No description"}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-4">
                      <button
                        type="button"
                        onClick={() =>
                          handleEdit(category)
                        }
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(
                            category._id
                          )
                        }
                        className="text-sm font-medium text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminCategories;