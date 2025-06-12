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

    const subscriptionData = req.body;

    // Validate required fields
    const requiredFields = ["planName", "planDescription", "planDuration", "planCategory", "basePrice"];
    const missingFields = requiredFields.filter(field => !subscriptionData[field]);

    if (missingFields.length) {
      return res.status(400).json({ message: `Missing required fields: ${missingFields.join(", ")}` });
    }

    // If _id is present, update existing subscriptionType
    if (subscriptionData._id) {
      const existingPackage = vendor.subscriptiontype.id(subscriptionData._id);
      if (!existingPackage) {
        return res.status(404).json({ message: "Subscription package not found" });
      }

      // Update fields
      Object.assign(existingPackage, subscriptionData);
    } else {
      // Else add a new package
      vendor.subscriptiontype.push(subscriptionData);
    }

    await vendor.save();

    return res.status(200).json({
      message: `Subscription package ${subscriptionData._id ? "updated" : "added"} successfully`,
      subscriptiontype: vendor.subscriptiontype,
    });

  } catch (error) {
    console.error("Subscription update error:", error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});






router.delete("/updateprofile/subscriptiontype", isauthenticated, async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ Vendor_id: req.Vendor.Vendor_id });

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    const { subscriptionTypeId } = req.body;

    if (!subscriptionTypeId) {
      return res.status(400).json({ message: "subscriptionTypeId is required" });
    }

    // Remove subscription type by _id using $pull
    const result = await Vendor.updateOne(
      { Vendor_id: req.Vendor.Vendor_id },
      { $pull: { subscriptiontype: { _id: subscriptionTypeId } } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "Subscription package not found" });
    }

    return res.status(200).json({
      message: "Subscription package deleted successfully",
    });

  } catch (error) {
    console.error("Subscription delete error:", error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});


// Route to add meal type
router.post("/updateprofile/add/mealtype", isauthenticated, async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ Vendor_id: req.Vendor.Vendor_id });
    const { mealtype } = req.body;

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    if (!mealtype) {
      return res.status(400).json({ message: "Meal type is required" });
    }

    // Avoid duplicate meal types
    if (vendor.mealtype.includes(mealtype)) {
      return res.status(409).json({ message: `Meal type '${mealtype}' already exists.` });
    }

    vendor.mealtype.push(mealtype);
    await vendor.save();

    return res.status(200).json({
      message: `Meal type '${mealtype}' added successfully`,
      mealtype: vendor.mealtype,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message
    });
  }
});


// Route to add subscription days
router.post('/add/days', isauthenticated, async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ Vendor_id: req.Vendor.Vendor_id });
    const { days } = req.body;

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    if (days === undefined || days === null) {
      return res.status(400).json({ message: "Days are required" });
    }

    if (vendor.subscriptionDuration.includes(days)) {
      return res.status(409).json({ message: `Days '${days}' already exists.` });
    }

    vendor.subscriptionDuration.push(days);
    await vendor.save();

    return res.status(200).json({
      message: `Days '${days}' added successfully`,
      subscriptionDuration: vendor.subscriptionDuration
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message
    });
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