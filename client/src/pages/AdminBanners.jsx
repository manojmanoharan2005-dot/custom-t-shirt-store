import { useEffect, useState } from "react";

import Loader from "../components/Loader";
import bannerService from "../services/bannerService";

const initialForm = {
  title: "",
  subtitle: "",
  buttonText: "",
  buttonLink: "",

  rightTitle: "",
  rightSubtitle: "",
  rightButtonText: "",
  rightButtonLink: "",

  leftImage: null,
  rightImage: null,

  displayOrder: 0,
  isActive: true,
};

const AdminBanners = () => {
  const [banners, setBanners] = useState([]);
  const [form, setForm] = useState(initialForm);

  const [leftImagePreview, setLeftImagePreview] =
    useState("");

  const [rightImagePreview, setRightImagePreview] =
    useState("");

  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadBanners = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await bannerService.getAllBanners();

      setBanners(response.banners || []);
    } catch (error) {
      console.error(
        "Failed to load banners:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to load banners."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  const validateImage = (file) => {
    if (!file) {
      return false;
    }

    if (!file.type.startsWith("image/")) {
      setError(
        "Please select a valid image file."
      );

      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        "Image size must be less than 5 MB."
      );

      return false;
    }

    return true;
  };

  const handleLeftImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");
    setMessage("");

    if (!validateImage(file)) {
      event.target.value = "";
      return;
    }

    setForm((current) => ({
      ...current,
      leftImage: file,
    }));

    const previewUrl =
      URL.createObjectURL(file);

    setLeftImagePreview(previewUrl);
  };

  const handleRightImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");
    setMessage("");

    if (!validateImage(file)) {
      event.target.value = "";
      return;
    }

    setForm((current) => ({
      ...current,
      rightImage: file,
    }));

    const previewUrl =
      URL.createObjectURL(file);

    setRightImagePreview(previewUrl);
  };

  const resetForm = () => {
    setForm({
      ...initialForm,
    });

    setLeftImagePreview("");
    setRightImagePreview("");

    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!form.title.trim()) {
        setError(
          "Left banner title is required."
        );
        return;
      }

      if (!editingId) {
        if (!form.leftImage) {
          setError(
            "Please select a left side image."
          );
          return;
        }

        if (!form.rightImage) {
          setError(
            "Please select a right side image."
          );
          return;
        }
      }

      const bannerData = {
        title: form.title.trim(),

        subtitle:
          form.subtitle.trim(),

        buttonText:
          form.buttonText.trim(),

        buttonLink:
          form.buttonLink.trim(),

        rightTitle:
          form.rightTitle.trim(),

        rightSubtitle:
          form.rightSubtitle.trim(),

        rightButtonText:
          form.rightButtonText.trim(),

        rightButtonLink:
          form.rightButtonLink.trim(),

        leftImage: form.leftImage,
        rightImage: form.rightImage,

        displayOrder:
          Number(form.displayOrder) || 0,

        isActive: form.isActive,
      };

      if (editingId) {
        await bannerService.updateBanner(
          editingId,
          bannerData
        );

        setMessage(
          "Banner updated successfully."
        );
      } else {
        await bannerService.createBanner(
          bannerData
        );

        setMessage(
          "Banner created successfully."
        );
      }

      resetForm();

      await loadBanners();
    } catch (error) {
      console.error(
        "Save banner error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to save banner."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (banner) => {
    setEditingId(banner._id);

    setForm({
      title: banner.title || "",

      subtitle:
        banner.subtitle || "",

      buttonText:
        banner.buttonText || "",

      buttonLink:
        banner.buttonLink || "",

      rightTitle:
        banner.rightTitle || "",

      rightSubtitle:
        banner.rightSubtitle || "",

      rightButtonText:
        banner.rightButtonText || "",

      rightButtonLink:
        banner.rightButtonLink || "",

      leftImage: null,
      rightImage: null,

      displayOrder:
        banner.displayOrder ?? 0,

      isActive:
        banner.isActive ?? true,
    });

    setLeftImagePreview(
      banner.leftImage ||
        banner.image ||
        banner.imageUrl ||
        ""
    );

    setRightImagePreview(
      banner.rightImage ||
        banner.image ||
        banner.imageUrl ||
        ""
    );

    setError("");
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (bannerId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this banner?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setMessage("");

      await bannerService.deleteBanner(
        bannerId
      );

      setBanners((currentBanners) =>
        currentBanners.filter(
          (banner) =>
            banner._id !== bannerId
        )
      );

      if (editingId === bannerId) {
        resetForm();
      }

      setMessage(
        "Banner deleted successfully."
      );
    } catch (error) {
      console.error(
        "Delete banner error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to delete banner."
      );
    }
  };

  if (loading) {
    return (
      <Loader text="Loading banners..." />
    );
  }

  return (
    <div className="w-full min-w-0">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Homepage Banners
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage promotional banners displayed
          on the homepage.
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

      <div className="grid min-w-0 grid-cols-1 gap-8 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section className="h-fit min-w-0 rounded-xl border bg-white p-6">
          <h2 className="text-lg font-bold text-gray-900">
            {editingId
              ? "Edit Banner"
              : "Add Banner"}
          </h2>

          <form
            onSubmit={handleSubmit}
            className="mt-5 space-y-6"
          >
            <div className="rounded-xl border bg-gray-50 p-4">
              <h3 className="mb-4 text-base font-bold text-gray-900">
                Left Side Content
              </h3>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Title
                </label>

                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                  placeholder="Create Your Style"
                  className="w-full min-w-0 rounded-lg border bg-white px-4 py-3 outline-none focus:border-black"
                />
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Subtitle
                </label>

                <textarea
                  name="subtitle"
                  value={form.subtitle}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Design custom T-shirts that are uniquely yours."
                  className="w-full min-w-0 rounded-lg border bg-white px-4 py-3 outline-none focus:border-black"
                />
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Button Text
                </label>

                <input
                  type="text"
                  name="buttonText"
                  value={form.buttonText}
                  onChange={handleChange}
                  placeholder="Start Designing"
                  className="w-full min-w-0 rounded-lg border bg-white px-4 py-3 outline-none focus:border-black"
                />
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Button Link
                </label>

                <input
                  type="text"
                  name="buttonLink"
                  value={form.buttonLink}
                  onChange={handleChange}
                  placeholder="/products"
                  className="w-full min-w-0 rounded-lg border bg-white px-4 py-3 outline-none focus:border-black"
                />
              </div>
            </div>

            <div className="rounded-xl border bg-gray-50 p-4">
              <h3 className="mb-4 text-base font-bold text-gray-900">
                Right Side Content
              </h3>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Title
                </label>

                <input
                  type="text"
                  name="rightTitle"
                  value={form.rightTitle}
                  onChange={handleChange}
                  placeholder="Wear Your Style"
                  className="w-full min-w-0 rounded-lg border bg-white px-4 py-3 outline-none focus:border-black"
                />
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Subtitle
                </label>

                <textarea
                  name="rightSubtitle"
                  value={form.rightSubtitle}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Fresh designs. Everyday comfort."
                  className="w-full min-w-0 rounded-lg border bg-white px-4 py-3 outline-none focus:border-black"
                />
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Button Text
                </label>

                <input
                  type="text"
                  name="rightButtonText"
                  value={form.rightButtonText}
                  onChange={handleChange}
                  placeholder="Shop Now"
                  className="w-full min-w-0 rounded-lg border bg-white px-4 py-3 outline-none focus:border-black"
                />
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Button Link
                </label>

                <input
                  type="text"
                  name="rightButtonLink"
                  value={form.rightButtonLink}
                  onChange={handleChange}
                  placeholder="/products"
                  className="w-full min-w-0 rounded-lg border bg-white px-4 py-3 outline-none focus:border-black"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Left Side Image
              </label>

              <input
                type="file"
                accept="image/*"
                onChange={
                  handleLeftImageChange
                }
                className="w-full min-w-0 rounded-lg border bg-white px-4 py-3 text-sm outline-none file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:font-medium"
              />

              <p className="mt-2 text-xs text-gray-500">
                JPG, PNG, WEBP • Maximum 5 MB
              </p>

              {leftImagePreview && (
                <div className="mt-3 overflow-hidden rounded-xl border bg-gray-100">
                  <img
                    src={leftImagePreview}
                    alt="Left banner preview"
                    className="aspect-video h-full w-full object-cover"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Right Side Image
              </label>

              <input
                type="file"
                accept="image/*"
                onChange={
                  handleRightImageChange
                }
                className="w-full min-w-0 rounded-lg border bg-white px-4 py-3 text-sm outline-none file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:font-medium"
              />

              <p className="mt-2 text-xs text-gray-500">
                JPG, PNG, WEBP • Maximum 5 MB
              </p>

              {rightImagePreview && (
                <div className="mt-3 overflow-hidden rounded-xl border bg-gray-100">
                  <img
                    src={rightImagePreview}
                    alt="Right banner preview"
                    className="aspect-video h-full w-full object-cover"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Display Order
              </label>

              <input
                type="number"
                name="displayOrder"
                value={form.displayOrder}
                onChange={handleChange}
                min="0"
                className="w-full min-w-0 rounded-lg border px-4 py-3 outline-none focus:border-black"
              />

              <p className="mt-2 text-xs text-gray-500">
                Lower numbers appear first.
              </p>
            </div>

            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                name="isActive"
                checked={form.isActive}
                onChange={handleChange}
                className="h-4 w-4"
              />

              <span className="text-sm font-medium text-gray-700">
                Active Banner
              </span>
            </label>

            {(leftImagePreview ||
              rightImagePreview) && (
              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">
                  Image Preview
                </p>

                <div className="grid grid-cols-2 gap-2 overflow-hidden rounded-xl border bg-gray-100">
                  <div className="relative aspect-square overflow-hidden bg-gray-100">
                    {leftImagePreview ? (
                      <img
                        src={leftImagePreview}
                        alt="Left preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-gray-400">
                        Left Image
                      </div>
                    )}

                    <span className="absolute bottom-2 left-2 rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white">
                      Left
                    </span>
                  </div>

                  <div className="relative aspect-square overflow-hidden bg-gray-100">
                    {rightImagePreview ? (
                      <img
                        src={rightImagePreview}
                        alt="Right preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-gray-400">
                        Right Image
                      </div>
                    )}

                    <span className="absolute bottom-2 left-2 rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white">
                      Right
                    </span>
                  </div>
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
          {banners.length === 0 ? (
            <div className="rounded-xl border bg-white p-10 text-center">
              <p className="text-gray-500">
                No banners found.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {banners.map((banner) => {
                const leftImage =
                  banner.leftImage ||
                  banner.image ||
                  banner.imageUrl ||
                  "";

                const rightImage =
                  banner.rightImage ||
                  banner.image ||
                  banner.imageUrl ||
                  "";

                return (
                  <div
                    key={banner._id}
                    className="min-w-0 overflow-hidden rounded-xl border bg-white shadow-sm"
                  >
                    <div className="grid grid-cols-2 bg-gray-100">
                      <div className="relative aspect-video overflow-hidden">
                        {leftImage && (
                          <img
                            src={leftImage}
                            alt={`${banner.title} left`}
                            className="h-full w-full object-cover"
                          />
                        )}

                        <div className="absolute bottom-3 left-3 rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white">
                          Left
                        </div>
                      </div>

                      <div className="relative aspect-video overflow-hidden">
                        {rightImage && (
                          <img
                            src={rightImage}
                            alt={`${banner.rightTitle || banner.title} right`}
                            className="h-full w-full object-cover"
                          />
                        )}

                        <div className="absolute bottom-3 left-3 rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white">
                          Right
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-2">
                      <div className="min-w-0 border-b pb-5 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                            Left
                          </span>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              banner.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {banner.isActive
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </div>

                        <h3 className="mt-3 font-semibold text-gray-900">
                          {banner.title}
                        </h3>

                        {banner.subtitle && (
                          <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                            {banner.subtitle}
                          </p>
                        )}

                        {banner.buttonText && (
                          <p className="mt-2 text-sm text-gray-500">
                            Button:{" "}
                            {banner.buttonText}
                          </p>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                            Right
                          </span>
                        </div>

                        <h3 className="mt-3 font-semibold text-gray-900">
                          {banner.rightTitle ||
                            "No right-side title"}
                        </h3>

                        {banner.rightSubtitle && (
                          <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                            {banner.rightSubtitle}
                          </p>
                        )}

                        {banner.rightButtonText && (
                          <p className="mt-2 text-sm text-gray-500">
                            Button:{" "}
                            {banner.rightButtonText}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 border-t p-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm text-gray-500">
                          Order:{" "}
                          {banner.displayOrder ??
                            0}
                        </p>

                        {banner.buttonLink && (
                          <p className="mt-1 truncate text-sm text-gray-500">
                            Left Link:{" "}
                            {banner.buttonLink}
                          </p>
                        )}

                        {banner.rightButtonLink && (
                          <p className="mt-1 truncate text-sm text-gray-500">
                            Right Link:{" "}
                            {banner.rightButtonLink}
                          </p>
                        )}
                      </div>

                      <div className="flex shrink-0 gap-4">
                        <button
                          type="button"
                          onClick={() =>
                            handleEdit(banner)
                          }
                          className="text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(
                              banner._id
                            )
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

export default AdminBanners;