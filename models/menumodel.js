import mongoose from "mongoose";

const daySchema = new mongoose.Schema({}, { _id: false, strict: false });

const menuSchema = new mongoose.Schema({
  Vendor_id: { type: String, required: true },
  mealType: { type: String },
  packageType: { type: String },
 menu: {
  monday: { type: daySchema, default: {} },
  tuesday: { type: daySchema, default: {} },
  wednesday: { type: daySchema, default: {} },
  thursday: { type: daySchema, default: {} },
  friday: { type: daySchema, default: {} },
  saturday: { type: daySchema, default: {} },
  sunday: { type: daySchema, default: {} },
},

});

const Menu = mongoose.model("Menu", menuSchema);
export default Menu;
