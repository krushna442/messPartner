import { image } from '@tensorflow/tfjs-core';
import { timeStamp } from 'console';
import express from 'express';
import mongoose from 'mongoose';
const paymentSchema = mongoose.Schema({
    image: String,
    user_id: String,
    Vendor_id:String,
    subscriptionType:String,
    amount:Number,
    name: String,
    phone: String
}, { timestamps: true });
const Payment = mongoose.model("Payment" ,paymentSchema);
export default Payment;
