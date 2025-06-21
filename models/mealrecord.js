import mongoose from "mongoose";

const mealRecordSchema = new mongoose.Schema({
  Vendor_id: { type: String, required: true },
  date: { type: String, required: true },
  subscriptionTypes: [{
    subscriptionTypeId: { type: mongoose.Schema.Types.ObjectId, required: true },
    planName: { type: String },
    planCategory: { type: String },
    meals: {
      // Dynamic meal types based on deliveryTypes
      // Example: { breakfast: [], lunch: [], dinner: [] }
    },
    totalMeals: { type: Number, default: 0 }
  }],
  createdAt: { type: Date, default: Date.now }
}, { strict: false }); // strict: false allows dynamic fields in meals object

const MealRecord = mongoose.model("MealRecord", mealRecordSchema);

export default MealRecord;