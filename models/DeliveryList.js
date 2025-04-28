import mongoose from "mongoose";
import { type } from "os";

const deliveryListSchema = new mongoose.Schema(
  {
    Vendor_id: { type: String, required: true },
    shopname: {type:String},
    date: { type: String, required: true },
    mealType: { type: String, required: true },
    deliveryGroups: [
      {
        groupName: { type: String },
        veg: [
          {
            user_id: { type: String },
            user_name: { type: String },
            number: { type: Number },
            address1:{type:String},
            address2:{type:String},
            _id: false // disable auto _id for each user object
          }
        ],
        nonVeg: [
          {
            user_id: { type: String },
            user_name: { type: String },
            number: { type: Number },
            address1:{type:String},
            address2:{type:String},
            _id: false // disable auto _id for each user object
          }
        ]
      }
    ]
  },
  { timestamps: true }
);

const DeliveryList = mongoose.model("DeliveryList", deliveryListSchema);
export default DeliveryList;
