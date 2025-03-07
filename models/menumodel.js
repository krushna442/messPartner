
import mongoose from "mongoose";

const menuSchema = new mongoose.Schema({
  Vendor_id: { type: String },
  menu: {
    monday: { breakfast: String, lunch: String, dinner: String },
    tuesday: { breakfast: String, lunch: String, dinner: String },
    wednesday: { breakfast: String, lunch: String, dinner: String },
    thursday: { breakfast: String, lunch: String, dinner: String },
    friday: { breakfast: String, lunch: String, dinner: String },
    saturday: { breakfast: String, lunch: String, dinner: String },
    sunday: { breakfast: String, lunch: String, dinner: String },
  },
});

const Menu = mongoose.model("Menu", menuSchema);
export default Menu;
