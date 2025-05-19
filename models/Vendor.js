import mongoose from 'mongoose';

const subscriptionTypeSchema = new mongoose.Schema({
  packageName: { type: String, required: true },
  price: { type: Number, required: true },
  meals: [{ type: String, required: true }],
  days: [{ type: Number }]
}, { _id: false }); // Prevent automatic _id creation for subdocuments



const notificationSchema = new mongoose.Schema({
  message: { type: String, required: true },
  user_id: { type: String, required: true },
  name: { type: String, required: true },
  url: { type: String },
  date: { type: Date, default: Date.now },
  read: { type: Boolean, default: false }
}, { _id: false });

const vendorSchema = new mongoose.Schema({
  Vendor_id: { type: String, required: true, unique: true },
  name: { type: String },
  email: { type: String, unique: true },
  number: { type: Number, unique: true },
  password: { type: String },
  image: { type: String },

  subscriptiontype: [subscriptionTypeSchema], // Array of subscription objects

  mealtype: { type: [String], default: ["breakfast", "lunch", "dinner"] }, // Array of Strings
  subscriptionDuration: { type: [Number], default: [1, 7, 30, 60, 90] }, // <-- FIXED here

  location: { type: [String] },
  shopname: { type: String },
  shoplocation: { type: String },
  contactmobile: { type: Number },
  whatsapp: { type: Number },
  mealToDeliver: { type: Number },
  scanner: { type: String },
  notifications: [notificationSchema]

}, { timestamps: true });

const Vendor = mongoose.model("Vendor", vendorSchema);

export default Vendor;
