const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    phone: {
      type: String,
      trim: true,
    },

    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },

    addresses: {
      type: [
        {
          fullName: {
            type: String,
            trim: true,
          },
          phone: {
            type: String,
            trim: true,
          },
          addressLine: {
            type: String,
            trim: true,
          },
          city: {
            type: String,
            trim: true,
          },
          state: {
            type: String,
            trim: true,
          },
          pincode: {
            type: String,
            trim: true,
          },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;