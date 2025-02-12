import { string } from '@tensorflow/tfjs-core';
import mongoose from 'mongoose';

const vendorSchema = new mongoose.Schema({
    Vendor_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    number: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Removed unique to allow password updates
    service: { type: Array, required: true },
    photo:{type:String}
}, { timestamps: true }); // Adds createdAt and updatedAt fields automatically

const Vendor = mongoose.model("Vendor", vendorSchema);

export default Vendor;
