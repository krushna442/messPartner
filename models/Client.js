import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  message: { type: String, required: true },
  Vendor_id: { type: String, required: true },
  shopname: { type: String, required: true },
  url: { type: String },
  date: { type: Date, default: Date.now },
  read: { type: Boolean, default: false }
}, { _id: false });

const clientSchema = new mongoose.Schema({
  user_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  number: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  address: { type: String, required: true },
  wishlist: { type: [String], default: [] },
  notifications: [notificationSchema]
});

const Client = mongoose.model("Client", clientSchema);

export default Client;
