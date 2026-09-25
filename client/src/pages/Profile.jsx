import { useEffect, useState } from "react";

import Loader from "../components/Loader";
import authService from "../services/authService";

import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";

const emptyAddress = {
  fullName: "",
  phone: "",
  addressLine: "",
  city: "",
  state: "",
  pincode: "",
};

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { showNotification } = useNotification();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
  });

  const [addressForm, setAddressForm] = useState(emptyAddress);
  const [editingAddressId, setEditingAddressId] = useState(null);

  const loadProfile = async () => {
    try {
      setLoading(true);

      const response = await authService.getProfile();
      const userData = response.user;

      setProfile(userData);

      setProfileForm({
        name: userData?.name || "",
        phone: userData?.phone || "",
      });
    } catch (error) {
      console.error("Failed to load profile:", error);

      showNotification(
        error.response?.data?.message ||
          "Failed to load profile.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleProfileChange = (event) => {
    const { name, value } = event.target;

    if (name === "phone") {
      const numbersOnly = value.replace(/\D/g, "");

      setProfileForm((current) => ({
        ...current,
        phone: numbersOnly.slice(0, 10),
      }));

      return;
    }

    setProfileForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleAddressChange = (event) => {
    const { name, value } = event.target;

    if (name === "phone") {
      const numbersOnly = value.replace(/\D/g, "");

      setAddressForm((current) => ({
        ...current,
        phone: numbersOnly.slice(0, 10),
      }));

      return;
    }

    if (name === "pincode") {
      const numbersOnly = value.replace(/\D/g, "");

      setAddressForm((current) => ({
        ...current,
        pincode: numbersOnly.slice(0, 6),
      }));

      return;
    }

    setAddressForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();

    const name = profileForm.name.trim();
    const phone = profileForm.phone.trim();

    if (!name) {
      showNotification(
        "Name is required.",
        "error"
      );
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      showNotification(
        "Phone number must contain exactly 10 digits.",
        "error"
      );
      return;
    }

    try {
      setSavingProfile(true);

      const response = await authService.updateProfile({
        name,
        phone,
      });

      setProfile(response.user);
      updateUser(response.user);

      showNotification(
        "Profile updated successfully.",
        "success"
      );
    } catch (error) {
      console.error("Update profile error:", error);

      showNotification(
        error.response?.data?.message ||
          "Failed to update profile.",
        "error"
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const resetAddressForm = () => {
    setAddressForm({ ...emptyAddress });
    setEditingAddressId(null);
  };

  const handleAddressSubmit = async (event) => {
    event.preventDefault();

    const phone = addressForm.phone.trim();
    const pincode = addressForm.pincode.trim();

    if (!/^\d{10}$/.test(phone)) {
      showNotification(
        "Phone number must contain exactly 10 digits.",
        "error"
      );
      return;
    }

    if (!/^\d{6}$/.test(pincode)) {
      showNotification(
        "Pincode must contain exactly 6 digits.",
        "error"
      );
      return;
    }

    try {
      setSavingAddress(true);

      const isEditing = Boolean(editingAddressId);

      const cleanedAddress = {
        ...addressForm,
        fullName: addressForm.fullName.trim(),
        phone,
        addressLine: addressForm.addressLine.trim(),
        city: addressForm.city.trim(),
        state: addressForm.state.trim(),
        pincode,
      };

      const response = isEditing
        ? await authService.updateAddress(
            editingAddressId,
            cleanedAddress
          )
        : await authService.addAddress(cleanedAddress);

      setProfile(response.user);
      updateUser(response.user);
      resetAddressForm();

      showNotification(
        isEditing
          ? "Address updated successfully."
          : "Address added successfully.",
        "success"
      );
    } catch (error) {
      console.error("Address save error:", error);

      showNotification(
        error.response?.data?.message ||
          "Failed to save address.",
        "error"
      );
    } finally {
      setSavingAddress(false);
    }
  };

  const handleEditAddress = (address) => {
    setEditingAddressId(address._id);

    setAddressForm({
      fullName: address.fullName || "",
      phone: address.phone || "",
      addressLine: address.addressLine || "",
      city: address.city || "",
      state: address.state || "",
      pincode: address.pincode || "",
    });

    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth",
    });
  };

  const handleDeleteAddress = async (addressId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this address?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response =
        await authService.deleteAddress(addressId);

      setProfile(response.user);
      updateUser(response.user);

      if (editingAddressId === addressId) {
        resetAddressForm();
      }

      showNotification(
        "Address deleted successfully.",
        "success"
      );
    } catch (error) {
      console.error("Delete address error:", error);

      showNotification(
        error.response?.data?.message ||
          "Failed to delete address.",
        "error"
      );
    }
  };

  if (loading) {
    return <Loader text="Loading profile..." />;
  }

  const currentName =
    profile?.name || user?.name || "User";

  const currentEmail =
    profile?.email || user?.email || "";

  const addresses = profile?.addresses || [];

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <div className="border-b border-gray-200 pb-7">
          <p className="text-sm text-gray-500">
            Account
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
            My Profile
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            Manage your account details and delivery addresses.
          </p>
        </div>

        <div className="grid gap-8 py-8 lg:grid-cols-3">
          <section className="border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center bg-black text-lg font-semibold text-white">
                {currentName.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0">
                <h2 className="truncate font-semibold text-gray-900">
                  {currentName}
                </h2>

                <p className="mt-1 truncate text-sm text-gray-500">
                  {currentEmail}
                </p>
              </div>
            </div>

            <div className="mt-6 border-t border-gray-200 pt-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Saved addresses
                </span>

                <span className="text-sm font-semibold text-gray-900">
                  {addresses.length}
                </span>
              </div>
            </div>
          </section>

          <section className="border border-gray-200 p-6 lg:col-span-2">
            <div className="mb-6">
              <h2 className="font-semibold text-gray-900">
                Personal Information
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Keep your account information up to date.
              </p>
            </div>

            <form
              onSubmit={handleProfileSubmit}
              className="grid gap-5 sm:grid-cols-2"
            >
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Full Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={profileForm.name}
                  onChange={handleProfileChange}
                  required
                  placeholder="Enter your name"
                  className="w-full border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-black"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Phone Number
                </label>

                <input
                  type="tel"
                  name="phone"
                  value={profileForm.phone}
                  onChange={handleProfileChange}
                  required
                  maxLength={10}
                  inputMode="numeric"
                  placeholder="10 digit phone number"
                  className="w-full border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-black"
                />

                <p className="mt-1 text-xs text-gray-400">
                  Enter exactly 10 digits.
                </p>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Email Address
                </label>

                <input
                  type="email"
                  value={currentEmail}
                  disabled
                  className="w-full border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500"
                />

                <p className="mt-1.5 text-xs text-gray-400">
                  Email address cannot be changed.
                </p>
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  {savingProfile
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </section>
        </div>

        <section className="border border-gray-200 p-6">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">
                Saved Addresses
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Manage addresses used during checkout.
              </p>
            </div>

            <span className="text-sm text-gray-400">
              {addresses.length} saved
            </span>
          </div>

          {addresses.length === 0 ? (
            <div className="border border-dashed border-gray-300 px-5 py-10 text-center">
              <p className="font-medium text-gray-700">
                No saved addresses
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Add your first delivery address below.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {addresses.map((address, index) => (
                <div
                  key={address._id}
                  className="border border-gray-200 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {address.fullName}
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        {address.phone}
                      </p>
                    </div>

                    <span className="text-xs text-gray-400">
                      #{index + 1}
                    </span>
                  </div>

                  <div className="mt-4 text-sm leading-6 text-gray-600">
                    <p>{address.addressLine}</p>

                    <p>
                      {address.city}, {address.state}
                    </p>

                    <p>{address.pincode}</p>
                  </div>

                  <div className="mt-5 flex gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        handleEditAddress(address)
                      }
                      className="border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteAddress(address._id)
                      }
                      className="border border-gray-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-8 border border-gray-200 p-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold text-gray-900">
                {editingAddressId
                  ? "Edit Address"
                  : "Add New Address"}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {editingAddressId
                  ? "Update the selected delivery address."
                  : "Add an address for faster checkout."}
              </p>
            </div>

            {editingAddressId && (
              <button
                type="button"
                onClick={resetAddressForm}
                className="text-sm text-gray-500 hover:text-black"
              >
                Cancel
              </button>
            )}
          </div>

          <form
            onSubmit={handleAddressSubmit}
            className="grid gap-5 sm:grid-cols-2"
          >
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Full Name
              </label>

              <input
                type="text"
                name="fullName"
                value={addressForm.fullName}
                onChange={handleAddressChange}
                required
                placeholder="Full name"
                className="w-full border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Phone Number
              </label>

              <input
                type="tel"
                name="phone"
                value={addressForm.phone}
                onChange={handleAddressChange}
                required
                maxLength={10}
                inputMode="numeric"
                placeholder="10 digit phone number"
                className="w-full border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-black"
              />

              <p className="mt-1 text-xs text-gray-400">
                Enter exactly 10 digits.
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Address
              </label>

              <textarea
                name="addressLine"
                value={addressForm.addressLine}
                onChange={handleAddressChange}
                required
                rows={3}
                placeholder="House number, street, area"
                className="w-full resize-none border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                City
              </label>

              <input
                type="text"
                name="city"
                value={addressForm.city}
                onChange={handleAddressChange}
                required
                placeholder="City"
                className="w-full border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                State
              </label>

              <input
                type="text"
                name="state"
                value={addressForm.state}
                onChange={handleAddressChange}
                required
                placeholder="State"
                className="w-full border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Pincode
              </label>

              <input
                type="text"
                name="pincode"
                value={addressForm.pincode}
                onChange={handleAddressChange}
                required
                maxLength={6}
                inputMode="numeric"
                placeholder="6-digit pincode"
                className="w-full border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-black"
              />
            </div>

            <div className="flex items-end gap-3">
              {editingAddressId && (
                <button
                  type="button"
                  onClick={resetAddressForm}
                  className="border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              )}

              <button
                type="submit"
                disabled={savingAddress}
                className="bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {savingAddress
                  ? "Saving..."
                  : editingAddressId
                    ? "Update Address"
                    : "Save Address"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

export default Profile;