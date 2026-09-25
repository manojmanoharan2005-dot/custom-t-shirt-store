import { useEffect, useState } from "react";

import Loader from "../components/Loader";
import designService from "../services/designService";

const initialForm = {
  name: "",
  image: null,
  category: "",
};

const AdminDesigns = () => {
  const [designs, setDesigns] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [imagePreview, setImagePreview] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadDesigns = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await designService.getDesigns();

      setDesigns(response.designs || []);
    } catch (error) {
      console.error("Failed to load designs:", error);

      setError(
        error.response?.data?.message ||
          "Failed to load designs."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDesigns();
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

    setError("");
    setMessage("");

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5 MB.");
      event.target.value = "";
      return;
    }

    setForm((current) => ({
      ...current,
      image: file,
    }));

    const previewUrl = URL.createObjectURL(file);

    setImagePreview(previewUrl);
  };

  const resetForm = () => {
    setForm(initialForm);
    setImagePreview("");
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!form.name.trim()) {
        setError("Design name is required.");
        return;
      }

      if (!editingId && !form.image) {
        setError("Please select a design image.");
        return;
      }

      const designData = {
        name: form.name.trim(),
        image: form.image,
        category: form.category.trim(),
      };

      if (editingId) {
        await designService.updateDesign(
          editingId,
          designData
        );

        setMessage("Design updated successfully.");
      } else {
        await designService.createDesign(designData);

        setMessage("Design created successfully.");
      }

      resetForm();

      await loadDesigns();
    } catch (error) {
      console.error("Save design error:", error);

      setError(
        error.response?.data?.message ||
          "Failed to save design."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (design) => {
    setEditingId(design._id);

    setForm({
      name: design.name || "",
      image: null,
      category: design.category || "",
    });

    setImagePreview(
      design.image ||
        design.imageUrl ||
        ""
    );

    setError("");
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (designId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this design?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setMessage("");

      await designService.deleteDesign(designId);

      setMessage("Design deleted successfully.");

      await loadDesigns();
    } catch (error) {
      console.error("Delete design error:", error);

      setError(
        error.response?.data?.message ||
          "Failed to delete design."
      );
    }
  };

  if (loading) {
    return <Loader text="Loading designs..." />;
  }

  return (
    <div className="w-full min-w-0">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Design Library
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage designs customers can use while
          customizing T-shirts.
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

      <div className="grid min-w-0 grid-cols-1 gap-8 xl:grid-cols-[320px_minmax(0,1fr)]">
        <section className="h-fit min-w-0 rounded-xl border bg-white p-6">
          <h2 className="text-lg font-bold text-gray-900">
            {editingId ? "Edit Design" : "Add Design"}
          </h2>

          <form
            onSubmit={handleSubmit}
            className="mt-5 space-y-5"
          >
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Design Name
              </label>

              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="e.g. Minimal Heart"
                className="w-full min-w-0 rounded-lg border px-4 py-3 outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Design Image
              </label>

              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full min-w-0 rounded-lg border bg-white px-4 py-3 text-sm outline-none file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:font-medium"
              />

              <p className="mt-2 text-xs text-gray-500">
                JPG, PNG, WEBP • Maximum 5 MB
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Category
              </label>

              <input
                type="text"
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="e.g. Quotes"
                className="w-full min-w-0 rounded-lg border px-4 py-3 outline-none focus:border-black"
              />
            </div>

            {imagePreview && (
              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">
                  Preview
                </p>

                <div className="aspect-square overflow-hidden rounded-xl border bg-gray-50">
                  <img
                    src={imagePreview}
                    alt="Design preview"
                    className="h-full w-full object-contain p-4"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-lg bg-black px-5 py-3 font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
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
                  className="rounded-lg border px-5 py-3 font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="min-w-0">
          {designs.length === 0 ? (
            <div className="rounded-xl border bg-white p-10 text-center">
              <p className="text-gray-500">
                No designs found.
              </p>
            </div>
          ) : (
            <div className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2 2xl:grid-cols-3">
              {designs.map((design) => {
                const image =
                  design.image ||
                  design.imageUrl ||
                  "";

                return (
                  <div
                    key={design._id}
                    className="min-w-0 overflow-hidden rounded-xl border bg-white shadow-sm"
                  >
                    <div className="aspect-square w-full max-h-80 bg-gray-100">
                      {image ? (
                        <img
                          src={image}
                          alt={design.name}
                          className="h-full w-full object-contain p-5"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-gray-400">
                          No image
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <h3 className="truncate font-semibold text-gray-900">
                        {design.name}
                      </h3>

                      {design.category && (
                        <p className="mt-1 truncate text-sm text-gray-500">
                          {design.category}
                        </p>
                      )}

                      <div className="mt-4 flex gap-4 border-t pt-4">
                        <button
                          type="button"
                          onClick={() =>
                            handleEdit(design)
                          }
                          className="text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(design._id)
                          }
                          className="text-sm font-medium text-red-600 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
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

export default AdminDesigns;