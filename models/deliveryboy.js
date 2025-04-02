import mongoose from "mongoose";

const deliverySchema = new mongoose.Schema({
    name: String,
    phone:{type:String,unique:true},
    Vendor_id:String,
});
const Deliveryboy = mongoose.model("Delivery", deliverySchema);

export default Deliveryboy;