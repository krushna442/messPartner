import express from "express";
import cookieParser from "cookie-parser";
import Vendor from "../models/Vendor.js";
import isauthenticated from "../utils/authmiddlewware.js";
import multer from 'multer';

const router = express.Router();
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
router.use(cookieParser());

router.post("/updateprofile/shopdetail", isauthenticated, async (req, res) => {
  try {
    const vendorDetails = await Vendor.findOne({
      Vendor_id: req.Vendor.Vendor_id,
    });

    if (!vendorDetails) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    const { shopname, shoplocation, location } = req.body;

    if (!shopname || !shoplocation || !location) {
      return res.status(400).json({ message: "Please fill all the fields" });
    }

    // Update vendor details
    vendorDetails.shopname = shopname;
    vendorDetails.shoplocation = shoplocation;
    vendorDetails.location = location.split(',').map(loc => loc.trim());

    // Save updated vendor details
    await vendorDetails.save();

    return res
      .status(200)
      .json({ message: "Profile updated successfully", vendor: vendorDetails });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
});

router.post("/updateprofile/contact", isauthenticated, async (req, res) => {
  try {
    const vendorDetails = await Vendor.findOne({
      Vendor_id: req.Vendor.Vendor_id,
    });
    if (!vendorDetails) {
      return res.status(404).json({ message: "Vendor not found" });
    }
    const { contactmobile, whatsapp } = req.body;
    if (!contactmobile || !whatsapp) {
      return res.status(400).json({ message: "Please fill all the fields" });
    }
    // Update vendor details
    vendorDetails.contactmobile = contactmobile;
    vendorDetails.whatsapp = whatsapp;
    await vendorDetails.save();
    res
      .status(201)
      .json({
        message: "contact information added succesfully",
        vendorDetails: vendorDetails,
      });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
});
router.post("/updateprofile/subscriptiontype", isauthenticated, async (req, res) => { 
  try {
    const vendor = await Vendor.findOne({ Vendor_id: req.Vendor.Vendor_id });

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    const { packageName, price, meals, days } = req.body;

    if (!packageName || !meals || price === undefined) {
      return res.status(400).json({ message: "Package name, price, and meals are required" });
    }

    const existingIndex = vendor.subscriptiontype.findIndex(
      (pkg) => pkg.packageName === packageName
    );

    if (existingIndex !== -1) {
      vendor.subscriptiontype[existingIndex].price = price;
      vendor.subscriptiontype[existingIndex].meals = meals;
      vendor.subscriptiontype[existingIndex].days = days; // ✅ Update days too
    } else {
      vendor.subscriptiontype.push({ packageName, price, meals, days }); // ✅ Add new entry with days
    }

    await vendor.save();

    return res.status(200).json({
      message: `Subscription package '${packageName}' added/updated successfully`,
      subscriptiontype: vendor.subscriptiontype,
    });

  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});





router.delete("/updateprofile/subscriptiontype", isauthenticated, async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ Vendor_id: req.Vendor.Vendor_id });

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    const { packageName } = req.body;

    if (!packageName) {
      return res.status(400).json({ message: "Package name is required" });
    }

    const initialLength = vendor.subscriptiontype.length;

    // Remove the package with the given name
    vendor.subscriptiontype = vendor.subscriptiontype.filter(
      (pkg) => pkg.packageName !== packageName
    );

    if (vendor.subscriptiontype.length === initialLength) {
      return res.status(404).json({ message: `Package '${packageName}' not found` });
    }

    await vendor.save();

    return res.status(200).json({
      message: `Subscription package '${packageName}' deleted successfully`,
      subscriptiontype: vendor.subscriptiontype,
    });

  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});



const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/add/scanner', upload.single("scanner"), isauthenticated, async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ Vendor_id: req.Vendor.Vendor_id });

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const imageBase64 = req.file.buffer.toString("base64");
    vendor.scanner = imageBase64;

    await vendor.save();

    return res.status(200).json({
      message: "Scanner added successfully",
      scanner: vendor.scanner
    });

  } catch (error) {
    console.error("Error adding scanner:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message
    });
  }
});

export default router;