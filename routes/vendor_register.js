import express, { urlencoded } from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import cookieParser from "cookie-parser";
import { string } from '@tensorflow/tfjs-core';
const router = express.Router();
router.use(cookieParser());



router.use(express.json());
router.use(express.urlencoded({ extended: true }));


const isauthenticated = (req,res,next)=>{
    const token = req.cookies.token;
    if(!token){
        return res.status(401).json({ message: "login first" });
    }

    try {
        const decoded = jwt.verify(token, "krushna"); 
        req.Vendor = decoded;
        next();
      } catch (error) {
        return res.status(403).json({ message: "Invalid token" });
      }
    
}

router.post("/home",isauthenticated,(req,res)=>{
    res.status(200).json({ message: "this is home page" })
})


const vendorSchema =new mongoose.Schema({
    Vendor_id:{type:String ,required:true,unique:true},
    name: { type: String, required: true},
    email: { type: String, required: true ,unique:true },
    number: { type: String, required: true ,unique:true },
    password: { type: String, required: true ,unique:true }
    });
    const Vendor = mongoose.model("Vendor", vendorSchema);

    // Register Vendor
    router.post("/register", async (req, res) => {
      try {
          const { name, email, number, password } = req.body;
  
          // Fetch the last vendor ID in descending order
          const lastvendor = await Vendor.findOne().sort({ Vendor_id: -1 });
  
          let newVendorId;
          if (lastvendor && lastvendor.Vendor_id) {
              const lastNum = parseInt(lastvendor.Vendor_id.split("-").pop(), 10);
              newVendorId = `RARSI-v-${lastNum + 1}`;
          } else {
              newVendorId = "RARSI-v-1";
          }
  
          const newvendor = new Vendor({
              Vendor_id: newVendorId,
              name,
              email,
              number,
              password,
          });
  
          await newvendor.save();
          res.status(201).json({ message: "Vendor created", Vendor_id: newVendorId });
      } catch (error) {
          console.error("Error:", error);
          res.status(500).json({ error: "Internal Server Error" });
      }
  });
  



// login section starts here
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const Vendordata = await Vendor.findOne({ email: email });
    if (!Vendordata) {
        return res.status(401).json({ message: "Unauthorized: Invalid email" });
    }
    if (Vendordata.password !== password) {
        return res.status(401).json({ message: "Unauthorized: Invalid password" });
    }

    // Create JWT token
    const token = jwt.sign({ _id: Vendordata._id }, "krushna");

    // Set token in cookie
    res.cookie("token", token, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, 
    });

    // Send response after setting the cookie
    console.log("Vendor logged in:", Vendordata);
    res.status(200).json({ message: "Successfully logged in" });
});




// logout section 
router.get("/logout", (req, res) => {
    res.clearCookie("token");
    res.status(200).json({ message: "Logged out successfully" });
});


export default router;