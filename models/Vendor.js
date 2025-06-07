import { unique } from '@tensorflow/tfjs-core';
import mongoose from 'mongoose';

const subscriptionTypeSchema = new mongoose.Schema({
  packageName: { type: String, required: true },
  price: { type: Number, required: true },
  meals: [{ type: String, required: true }],
  days: { type: Number },
  types:[{ type: String, required: true }] ,// for veg ,noveg
  status:{type:String,default:"Active"}
}, { _id: false });

const notificationSchema = new mongoose.Schema({
  message: { type: String, required: true },
  user_id: { type: String, required: true },
  name: { type: String, required: true },
  url:{ type: String },
  date: { type: Date, default: Date.now },
  read: { type: Boolean, default: false }
}, { _id: false });

const vendorSchema = new mongoose.Schema({
  Vendor_id: { type: String, required: true, unique: true },
  businessName: { type: String },
  businessEmail: { type: String},
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



}, { timestamps: true });

const Vendor = mongoose.model("Vendor", vendorSchema);

export default Vendor;
