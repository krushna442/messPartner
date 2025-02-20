import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Vendor from "../models/Vendor.js";
dotenv.config();

const router = express.Router();

router.get("/showVendors", async (req, res) => {
  try {
    // const vendors = await Vendor.find({}).sort({ _id: -1 }).limit(10);

    const vendors =await Vendor.find({}, {}).sort({
      _id: -1,
    }).limit(10);
    res.json(vendors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
