import { string } from '@tensorflow/tfjs-core';
import mongoose from 'mongoose';
import { type } from 'os';

const vendorSchema = new mongoose.Schema({
    Vendor_id: { type: String, required: true, unique: true },
    name: { type: String,  },
    email: { type: String, unique: true },
    number: { type: String, unique: true },
    password: { type: String }, // Removed unique to allow password updates
    photo:{type:String},
    address:{type:String},
    subscriptiontype:{type:Array},
    mealtype:{type :Array},
    service: { type: Array },
    contactmobile:{type: String},
    whatsapp:{type :String},
    
    
}, { timestamps: true }); // Adds createdAt and updatedAt fields automatically

const Vendor = mongoose.model("Vendor", vendorSchema);

export default Vendor;
