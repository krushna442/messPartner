import mongoose from "mongoose";

const deliveryListSchema = new mongoose.Schema(
  {
    Vendor_id: { type: String, required: true },
    date: { type: String, required: true }, // Store date as YYYY-MM-DD
    mealType: { type: String, required: true },
    deliveryGroups: [
      {
        groupName: { type: String },
        users: [
          {
            user_id: { type: String },
            user_name: { type: String },
            number: { type: Number },
          }
        ]
      }
    ]
  },
  { timestamps: true }
);

const DeliveryList = mongoose.model("DeliveryList", deliveryListSchema);
export default DeliveryList;
