import mongoose from "mongoose";

const daySchema = new mongoose.Schema({}, { _id: false, strict: false });

const menuSchema = new mongoose.Schema({
  Vendor_id: { type: String, required: true },
  mealType: { type: String },
  packageType: { type: String },
  menu: {
    monday: { type: daySchema },
    tuesday: { type: daySchema },
    wednesday: { type: daySchema },
    thursday: { type: daySchema },
    friday: { type: daySchema },
    saturday: { type: daySchema },
    sunday: { type: daySchema },
  },
});

const Menu = mongoose.model("Menu", menuSchema);
export default Menu;
