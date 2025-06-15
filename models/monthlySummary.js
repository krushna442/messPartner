import mongoose from "mongoose";
import { type } from "os";

const MOnthlySummarySchema = new mongoose.Schema({
  vendorId: { type:String, required: true },
  updatedAt: { type: Date, required: true },
  totalIncome: { type: Number, default: 0 },
  totalEarnings:{type:Number,default:0},
  totalExpenses: { type: Number, default: 0 },
  netProfit: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const MOnthlySummary = mongoose.model('MOnthlySummary', MOnthlySummarySchema);
export default MOnthlySummary;