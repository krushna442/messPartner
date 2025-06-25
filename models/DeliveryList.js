import mongoose from "mongoose";
import { type } from "os";

const deliveryRecordSchema = new mongoose.Schema({
  Vendor_id: { type: String, required: true },
  date: { type: String, required: true },
  deliveryGroup:[  {
    groupName:{type:String},
    agentData: {
      name: { type: String, },
      number: { type: String, },
    },
    meals: {
      breakfast: [
        {
          subscriber: { type: Object },
          status: {
            type: String,
            enum: ["pending", "delivered", "skipped"],
            default: "pending",
          },
        },
      ],
      lunch: [
        {
          subscriber: { type: Object },
          status: {
            type: String,
            enum: ["pending", "delivered", "skipped"],
            default: "pending",
          },
        },
      ],
      dinner: [
        {
          subscriber: { type: Object },
          status: {
            type: String,
            enum: ["pending", "delivered", "skipped"],
            default: "pending",
          },
        },
      ],
    },
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const DeliveryRecord = mongoose.model("DeliveryRecord", deliveryRecordSchema);

export default DeliveryRecord;
