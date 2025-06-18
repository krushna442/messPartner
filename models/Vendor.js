import { unique } from "@tensorflow/tfjs-core";
import mongoose from "mongoose";

const subscriptionTypeSchema = new mongoose.Schema(
  {
    planName: {
      type: String,
      required: true,
      trim: true,
    },
    planDescription: {
      type: String,
      required: true,
    },
    planDuration: {
      type: Number,
      required: true,
    },
    planCategory: {
      type: String,
      required: true,
    },
    basePrice: {
      type: Number,
      required: true,
    },
    menuType: {
      type: String,
      enum: ["fixed", "custom"],
      default: "fixed",
      required: true,
    },
    // Simple fields (maintained for backward compatibility)
    breakfast: {
      type: String,
      default: "",
    },
    lunch: {
      type: String,
      default: "",
    },
    dinner: {
      type: String,
      default: "",
    },
    // New weekly meals structure
    meals: {
      type: {
        Monday: {
          breakfast: { type: String, default: "" },
          lunch: { type: String, default: "" },
          dinner: { type: String, default: "" }
        },
        Tuesday: {
          breakfast: { type: String, default: "" },
          lunch: { type: String, default: "" },
          dinner: { type: String, default: "" }
        },
        Wednesday: {
          breakfast: { type: String, default: "" },
          lunch: { type: String, default: "" },
          dinner: { type: String, default: "" }
        },
        Thursday: {
          breakfast: { type: String, default: "" },
          lunch: { type: String, default: "" },
          dinner: { type: String, default: "" }
        },
        Friday: {
          breakfast: { type: String, default: "" },
          lunch: { type: String, default: "" },
          dinner: { type: String, default: "" }
        },
        Saturday: {
          breakfast: { type: String, default: "" },
          lunch: { type: String, default: "" },
          dinner: { type: String, default: "" }
        },
        Sunday: {
          breakfast: { type: String, default: "" },
          lunch: { type: String, default: "" },
          dinner: { type: String, default: "" }
        }
      },
      default: {
        Monday: { breakfast: "", lunch: "", dinner: "" },
        Tuesday: { breakfast: "", lunch: "", dinner: "" },
        Wednesday: { breakfast: "", lunch: "", dinner: "" },
        Thursday: { breakfast: "", lunch: "", dinner: "" },
        Friday: { breakfast: "", lunch: "", dinner: "" },
        Saturday: { breakfast: "", lunch: "", dinner: "" },
        Sunday: { breakfast: "", lunch: "", dinner: "" }
      }
    },
    // Image references
    menuImageDriveId: {
      type: String,
      default: "",
    },
    bannerImageDriveId: {
      type: String,
      default: "",
    },
    breakfastImagesDriveIds: {
      type: [String],
      default: ["", "", "", "", ""],
    },
    lunchImagesDriveIds: {
      type: [String],
      default: ["", "", "", "", ""],
    },
    dinnerImagesDriveIds: {
      type: [String],
      default: ["", "", "", "", ""],
    },
    // Delivery settings
    deliveryTypes: {
      type: [String],
      enum: ["Breakfast", "Lunch", "Dinner"],
      default: []
    },
    tags: {
      type: [String],
      default: []
    },
    maxSubscribers: {
      type: Number,
      default: 0  // 0 could represent unlimited
    },
    waitingList: {
      type: Boolean,
      default: true
    },
    deliveryZones: {
      type: [String],
      default: []
    },
    maxDeliveryDistance: {
      type: Number,
      default: 0
    },
    customDeliveryZones: {
      type: [String],
      default: []
    },
    subscribers:{type:Number,default:0}
  },
  {
    timestamps: true  // Adds createdAt and updatedAt fields
  }
);

const notificationSchema = new mongoose.Schema(
  {
    message: { type: String, required: true },
    user_id: { type: String, required: true },
    name: { type: String, required: true },
    url: { type: String },
    date: { type: Date, default: Date.now },
    read: { type: Boolean, default: false },
  },
  { _id: false }
);

const vendorSchema = new mongoose.Schema(
  {
    Vendor_id: { type: String, required: true, unique: true },
    businessName: { type: String },
    businessEmail: { type: String },
    businessContact: { type: String },
    addressLine: { type: String },
    city: { type: String },
    pincode: { type: String },
    ownerMobile: { type: String },
    password: { type: String },
    image: { type: String },

    subscriptiontype: [subscriptionTypeSchema],
    mealtype: { type: [String], default: ["breakfast", "lunch", "dinner"] },
    subscriptionDuration: { type: [Number], default: [30, 60, 90] },

    location: { type: [String] },
    shopname: { type: String },
    shoplocation: { type: String },
    contactmobile: { type: Number },
    whatsapp: { type: Number },
    mealToDeliver: { type: Number },
    scanner: { type: String },
    notifications: [notificationSchema],

    // 👇 Newly added fields
    aadharFront: { type: String },
    aadharBack: { type: String },
    passportOrDL: { type: String },
    fssaiLicense: { type: String },
    gstinCertificate: { type: String },
    kitchenPhoto: { type: String },
    diningArea: { type: String },
    exteriorView: { type: String },
  },
  { timestamps: true }
);

const Vendor = mongoose.model("Vendor", vendorSchema);

export default Vendor;
