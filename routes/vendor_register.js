import express, { urlencoded } from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import Vendor from "../models/Vendor.js"; // Make sure to import the Vendor model
import multer from "multer";
import isauthenticated from "../utils/authmiddlewware.js";

const router = express.Router();
router.use(cookieParser());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.use(express.json());
router.use(express.urlencoded({ extended: true }));


//   const token = req.cookies.token;
//   if (!token) {
//     return res.status(401).json({ message: "login first" });
//   }

//   try {
//     const decoded = jwt.verify(token, "krushna");
//     req.Vendor = decoded;
//     next();
//   } catch (error) {
//     return res.status(403).json({ message: "Invalid token" });
//   }
// };

router.post("/home", isauthenticated, async (req, res) => {
  res.status(200).json({
    message: "This is the home page",
vendorDetails: await Vendor.findById(req.Vendor._id)
    // vendorDetails: req.Vendor // Sending vendor details in response
  });
});

// Register Vendor



router.post("/register", upload.fields([
  { name: "image" },
  { name: "aadharFront" },
  { name: "aadharBack" },
  { name: "passportOrDL" },
  { name: "fssaiLicense" },
  { name: "gstinCertificate" },
  { name: "kitchenPhoto" },
  { name: "diningArea" },
  { name: "exteriorView" }
]), async (req, res) => {
  try {
    const {
      businessName,
      businessEmail,
      businessContact,
      ownerMobile,
      addressLine,
      city,
      pincode,
      password
    } = req.body;

    // Vendor_id Auto Generate
    const lastVendor = await Vendor.findOne({}, { Vendor_id: 1 }).sort({ _id: -1 });
    let newVendorId = lastVendor && lastVendor.Vendor_id
      ? `MP-v-${parseInt(lastVendor.Vendor_id.split("-").pop(), 10) + 1}`
      : "MP-v-1";

    // Check for Existing Vendor
    const existingVendor = await Vendor.findOne({ $or: [{ businessEmail }, { ownerMobile }] });
    if (existingVendor) {
      return res.status(400).json({ message: "Vendor already exists with this email or number" });
    }

    // Convert images to base64
    const toBase64 = (file) => file ? file[0].buffer.toString("base64") : null;

    const newvendor = new Vendor({
      Vendor_id: newVendorId,
  
      password,
      image: toBase64(req.files["image"]),


      businessName,
      businessEmail,
      businessContact,
      ownerMobile,
      addressLine,
      city,
      pincode,

      aadharFront: toBase64(req.files["aadharFront"]),
      aadharBack: toBase64(req.files["aadharBack"]),
      passportOrDL: toBase64(req.files["passportOrDL"]),
      fssaiLicense: toBase64(req.files["fssaiLicense"]),
      gstinCertificate: toBase64(req.files["gstinCertificate"]),
      kitchenPhoto: toBase64(req.files["kitchenPhoto"]),
      diningArea: toBase64(req.files["diningArea"]),
      exteriorView: toBase64(req.files["exteriorView"])
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
  try {
    const { ownerMobile, password, businessEmail } = req.body;

    // Ensure at least one identifier is provided
    if (!ownerMobile && !businessEmail) {
      return res.status(400).json({ message: "Please provide either mobile number or email" });
    }

    // Find vendor by either mobile or email
    const Vendordata = await Vendor.findOne({
      $or: [
        { ownerMobile: ownerMobile },
        { businessEmail: businessEmail }
      ]
    });

    if (!Vendordata) {
      return res.status(401).json({ message: "Unauthorized: Vendor not found" });
    }

    if (Vendordata.password !== password) {
      return res.status(401).json({ message: "Unauthorized: Invalid password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        _id: Vendordata._id,
        Vendor_id: Vendordata.Vendor_id,
        businessName: Vendordata.businessName,
      },
      process.env.JWTSECREAT
    );

    // Set cookie with JWT
    res.cookie("vendorToken", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: "/",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.status(200).json({
      message: "Successfully logged in",
      vendor: {
        id: Vendordata.Vendor_id,
        businessName: Vendordata.businessName,
      },
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


// logout section
router.get("/logout", (req, res) => {
  res.clearCookie("vendorToken", {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    path: "/",
  });
  res.status(200).json({ message: "Logged out successfully" });
});

export default router;
