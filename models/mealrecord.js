import mongoose from "mongoose";

const mealrecordSchema = new mongoose.Schema({
    Vendor_id: { type: String, required: true },
    date: { type: Date, required: true },
    breakfast: {
        veg: { type: [String], default: [] }, // Array of user IDs for veg meals
        nonVeg: { type: [String], default: [] } // Array of user IDs for non-veg meals
    },
    lunch: {
        veg: { type: [String], default: [] },
        nonVeg: { type: [String], default: [] }
    },
    dinner: {
        veg: { type: [String], default: [] },
        nonVeg: { type: [String], default: [] }
    }
});

const Mealrecord = mongoose.model("Mealrecord", mealrecordSchema);
export default Mealrecord;
