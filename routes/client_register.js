import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import isAuthenticated from "../utils/clientauth.js";
import Client from "../models/Client.js";
dotenv.config();
const router = express.Router();

router.use(cookieParser());



router.use(express.json());
router.use(express.urlencoded({ extended: true }));




// Middleware to check authentication
// const isAuthenticated = (req, res, next) => {
//   const token = req.cookies.token;
//   if (!token) {
//     return res.status(401).json({ message: "Unauthorized: No token provided" });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWTSECREAT);
//     req.user = decoded;
//     next();
//   } catch (error) {
//     return res.status(403).json({ message: "Invalid token" });
//   }
// };

router.post("/home", isAuthenticated, async (req, res) => {
  res.status(200).json({
    message: "This is the home page",
    clientDetails :await Client.findById(req.user._id)   
  });
});



// Define the schema correctly (Fix type issue)
// const clientSchema = new mongoose.Schema({
//   user_id: { type: String, required: true, unique: true },
//   name: { type: String, required: true },
//   email: { type: String, required: true, unique: true },
//   number: { type: String, required: true, unique: true },
//   password: { type: String, required: true, unique:false },
//   address: { type: String, required: true },
//   meal: { type: String, default: "yes" },
// });

// const Client = mongoose.model("Client", clientSchema);

// Register User  
router.post("/register", async (req, res) => {
  try {
    const { name, email, number, password,address } = req.body;

    const lastClient = await Client.findOne({}, { user_id: 1 }).sort({ _id: -1 });

let newUserId;
if (lastClient && lastClient.user_id) {
  const lastNum = parseInt(lastClient.user_id.split("-").pop(), 10);
  newUserId = `MP-c-${lastNum + 1}`;
} else {
  newUserId = "MP-c-1";
}

    const newClient = new Client({
      user_id: newUserId,
      name,
      email,
      number,
      password,
      address,
    });

    await newClient.save();
    res.status(201).json({ message: "User created", user_id: newUserId });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

// Login User
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const userdata = await Client.findOne({ email:email});
    

    if (!userdata) {
      return res.status(401).json({ message: "Unauthorized: Invalid email" });
    }
    if (userdata.password !== password) {
      return res.status(401).json({ message: "Unauthorized: Invalid password" });
    }
    // const token = jwt.sign(
    //       {
    //         _id: Vendordata._id,
    //         Vendor_id: Vendordata.Vendor_id,
    //       },
    //       process.env.JWTSECREAT
    //     );
    
    const token = jwt.sign({ 
      _id: userdata._id,
      user_id: userdata.user_id
     },process.env.JWTSECREAT);

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.status(200).json({ message: "Successfully logged in" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error",error });
  }
});

// Logout User
router.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logged out successfully" });
});


// Start Server
export default router;
