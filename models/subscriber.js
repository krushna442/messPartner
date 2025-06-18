import mongoose from "mongoose";

const subscriberSchema = mongoose.Schema(
  {
    userData: { type: Object },
    VendorData:{type:Object},   
    subscriptionId: { type: String },
    subscriptionType: {type:Object},
    address1:{type:String},
    address2:{type:String},
    subscriptionDate: { type: Date, default: Date.now },
    subscriptionEndDate: { type: Date }, 
    receivedBreakfast: { type: Number, default: 0 },
    receivedLunch: { type: Number, default: 0 },
    receivedDinner: { type: Number, default: 0 },
    mealOption: { type: Boolean, default: true },
    mealskipped:{type:Number,default:0},
    deliverygroup :{type:String},
    status:{type:String,default:"pending"},
    paymentDetails: { type: Object },
    
    },
  { timestamps: true }
);

const Subscriber = mongoose.model("Subscriber", subscriberSchema);

export default Subscriber;
