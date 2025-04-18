import mongoose from "mongoose";
const clientSchema = new mongoose.Schema({
  user_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  number: { type: String, required: true, unique: true },
  password: { type: String, required: true, unique:false },
  address: { type: String, required: true },
wishlist: { type: [String], default: [] }
}, { timestamps: true });

const Client = mongoose.model("Client", clientSchema);

 export default Client;