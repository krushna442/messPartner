import mongoose from 'mongoose';

const subscriptionTypeSchema = new mongoose.Schema({
  packageName: { type: String, required: true },
  price: { type: Number, required: true },
  meals: [{ type: String, required: true }] // Array of meal types
}, { _id: false }); // prevent automatic _id creation for subdocuments

const vendorSchema = new mongoose.Schema({
  Vendor_id: { type: String, required: true, unique: true },
  name: { type: String },
  email: { type: String, unique: true },
  number: { type: Number, unique: true },
  password: { type: String },
  image: { type: String },

  subscriptiontype: [subscriptionTypeSchema], // Array of subscription objects

  mealtype: { type: [String] }, // Array of Strings
  location: { type: [String] },
  shopname: { type: String },
  shoplocation: { type: String },
  contactmobile: { type: Number },
  whatsapp: { type: Number },
  mealToDeliver: { type: Number }
}, { timestamps: true });

const Vendor = mongoose.model("Vendor", vendorSchema);

export default Vendor;
