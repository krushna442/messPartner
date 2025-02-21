import mongoose from "mongoose";
import { type } from "os";

const subscriberSchema = mongoose.Schema(
  {
    user_id: { type: String },
    Vendor_id: { type: String },
    subscriptionId: { type: String },
    subscriptionType: {type:Number},
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
  },
  { timestamps: true }
);

const Subscriber = mongoose.model("Subscriber", subscriberSchema);

export default Subscriber;
