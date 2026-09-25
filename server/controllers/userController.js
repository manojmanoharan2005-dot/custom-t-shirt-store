const User = require("../models/User");

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select(
      "-password"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      message: "Profile fetched successfully",
      user,
    });
  } catch (error) {
    console.error(
      "Get profile error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    user.name = name ?? user.name;
    user.phone = phone ?? user.phone;

    await user.save();

    const updatedUser = await User.findById(
      user._id
    ).select("-password");

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error(
      "Update profile error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

const addAddress = async (req, res) => {
  try {
    const {
      fullName,
      phone,
      addressLine,
      city,
      state,
      pincode,
    } = req.body;

    if (
      !fullName ||
      !phone ||
      !addressLine ||
      !city ||
      !state ||
      !pincode
    ) {
      return res.status(400).json({
        message: "Complete address is required",
      });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    user.addresses.push({
      fullName: fullName.trim(),
      phone: phone.trim(),
      addressLine: addressLine.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
    });

    await user.save();

    const updatedUser = await User.findById(
      user._id
    ).select("-password");

    res.status(201).json({
      message: "Address added successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error(
      "Add address error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

const updateAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const address = user.addresses.id(
      req.params.addressId
    );

    if (!address) {
      return res.status(404).json({
        message: "Address not found",
      });
    }

    const {
      fullName,
      phone,
      addressLine,
      city,
      state,
      pincode,
    } = req.body;

    address.fullName =
      fullName?.trim() ?? address.fullName;

    address.phone =
      phone?.trim() ?? address.phone;

    address.addressLine =
      addressLine?.trim() ??
      address.addressLine;

    address.city =
      city?.trim() ?? address.city;

    address.state =
      state?.trim() ?? address.state;

    address.pincode =
      pincode?.trim() ?? address.pincode;

    await user.save();

    const updatedUser = await User.findById(
      user._id
    ).select("-password");

    res.status(200).json({
      message: "Address updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error(
      "Update address error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

const deleteAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const address = user.addresses.id(
      req.params.addressId
    );

    if (!address) {
      return res.status(404).json({
        message: "Address not found",
      });
    }

    address.deleteOne();

    await user.save();

    const updatedUser = await User.findById(
      user._id
    ).select("-password");

    res.status(200).json({
      message: "Address deleted successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error(
      "Delete address error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress,
};