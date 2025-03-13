import mongoose from "mongoose";

const deliverySchema = new mongoose.Schema({
    name: String,
    email: String,
    phone:{type:String,unique:true},
    Vendor_id:String,
});
const Delivery = mongoose.model("Delivery", deliverySchema);

export default Delivery;