import mongoose from "mongoose";
import { type } from "os";

const subscriberSchema = mongoose.Schema(
  {
    user_id: { type: String },
    Vendor_id: { type: String },
    VendorData:{type:Object},   
    user_name:{type:String},
    number:{type:Number},
    subscriptionId: { type: String },
    subscriptionType: {type:Number},
    packageType:{type:String},
    mealtype: { type: String },
    address1:{type:String},
    address2:{type:String},
    subscriptionDate: { type: Date, default: Date.now },
    subscriptionEndDate: { type: Date },
    totalMeal: { type: Number },
    receivedBreakfast: { type: Number, default: 0 },
    receivedLunch: { type: Number, default: 0 },
    receivedDinner: { type: Number, default: 0 },
    mealOption: { type: Boolean, default: true },
    mealskipped:{type:Number,default:0},
    deliverygroup :{type:String},
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },
    },
  { timestamps: true }
);

const Subscriber = mongoose.model("Subscriber", subscriberSchema);

export default Subscriber;
