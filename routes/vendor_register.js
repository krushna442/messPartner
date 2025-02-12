import express, { urlencoded } from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import cookieParser from "cookie-parser";
import Vendor from '../models/Vendor.js'; // Make sure to import the Vendor model
import multer from 'multer';
import cors from 'cors';

const router = express.Router();
router.use(cookieParser());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.use(express.json());
router.use(express.urlencoded({ extended: true }));
router.use(
    cors({
      origin: "http://localhost:5173", // ✅ Allow only frontend origin
      credentials: true, // ✅ Allow cookies
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );
  


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

router.post("/home",isauthenticated,async(req,res)=>{
    res.status(200).json({ 
        message: "This is the home page",
        vendorDetails:await Vendor.findOne({ Vendor_id:req.Vendor.Vendor_id }) // Sending vendor details in response
        // vendorDetails: req.Vendor // Sending vendor details in response
    });
})


    // Register Vendor
    router.post("/register",upload.single ('image'), async (req, res) => {

        console.log("Request Body:", req.body);  // Debugging
        console.log("Uploaded File:", req.file); // Debugging

        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        try {
            const { name, email, number, password, service } = req.body;
            // const photopath = req.file?req.file.path:null;
            const photoBase64 =req.file? req.file.buffer.toString('base64'):null;


            // Fetch the last vendor in descending order by `Vendor_id`

            const lastVendor = await Vendor.findOne({}, {Vendor_id: 1 }).sort({ _id: -1 });
    
            let newVendorId;
            if (lastVendor && lastVendor.Vendor_id) {
                const lastNum = parseInt(lastVendor.Vendor_id.split("-").pop(), 10);
                newVendorId = `RARSI-v-${lastNum + 1}`;
            } else {
                newVendorId = "RARSI-v-1";
            }
    
            // Check if the vendor already exists with email or number
            const existingVendor = await Vendor.findOne({ $or: [{ email }, { number }] });
            if (existingVendor) {
                return res.status(400).json({ message: "Vendor already exists with this email or number" });
            }
    
            const newvendor = new Vendor({
                Vendor_id: newVendorId,
                name,
                email,
                number,
                password,
                service,
                photo:photoBase64
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
    const { number, password } = req.body;
    const Vendordata = await Vendor.findOne({ number:number });
    if (!Vendordata) {
        return res.status(401).json({ message: "Unauthorized: Invalid email" });
    }
    if (Vendordata.password !== password) {
        return res.status(401).json({ message: "Unauthorized: Invalid password" });
    }

    // Create JWT token
    const token = jwt.sign({ _id: Vendordata._id,
        Vendor_id: Vendordata.Vendor_id
     }, "krushna");

    // Set token in cookie
    res.cookie("token", token, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, 
    });

    // Send response after setting the cookie
    res.status(200).json({ message: "Successfully logged in" });
});




// logout section 
router.get("/logout", (req, res) => {
    res.clearCookie("token");
    res.status(200).json({ message: "Logged out successfully" });
});


export default router;