import mongoose from 'mongoose';
import { type } from 'os';

const vendorSchema = new mongoose.Schema({
    Vendor_id: { type: String, required: true, unique: true },
    name: { type: String },
    email: { type: String, unique: true },
    number: { type: Number, unique: true },
    password: { type: String },
    image: { type: String },
    subscriptiontype: { type: [String] }, // Array of Strings
    mealtype: { type: [String] }, // Array of Strings
    location: { type: [String] }, // Array of Strings (or use { lat: Number, lng: Number } for coordinates)
    shopname: { type: String },
    shoplocation: { type: String },
    contactmobile: { type: Number },
    whatsapp: { type: Number },
    mealToDeliver:{type:Number}
}, { timestamps: true });

const Vendor = mongoose.model("Vendor", vendorSchema);

export default Vendor;
