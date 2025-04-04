import express from "express";
import cookieParser from "cookie-parser";
import Vendor from "../models/Vendor.js";
import isauthenticated from "../utils/authmiddlewware.js";

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

    const { packageName, price } = req.body;

    if (!packageName || price === undefined) {
      return res.status(400).json({ message: "Package name and price are required" });
    }

    // Ensure subscriptiontype is initialized
    if (!vendor.subscriptiontype) {
      vendor.subscriptiontype = new Map();
    }

    // Add or update package
    vendor.subscriptiontype.set(packageName, price);
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

    // Check if package exists
    if (!vendor.subscriptiontype.has(packageName)) {
      return res.status(404).json({ message: `Package '${packageName}' not found` });
    }

    // Remove package
    vendor.subscriptiontype.delete(packageName);
    await vendor.save();

    return res.status(200).json({
      message: `Subscription package '${packageName}' deleted successfully`,
      subscriptiontype: vendor.subscriptiontype,
    });

  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});


export default router;
