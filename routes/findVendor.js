import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Vendor from '../models/Vendor.js'; 

dotenv.config();

const router = express.Router();

router.post('/findVendor', async (req, res) => {
    try {
        const { area } = req.body;
        if (!area) {
            return res.status(400).json({ message: "Area is required" });
        }

        const vendors = await Vendor.find({ location: { $regex: new RegExp(area, "i") } });

        if (vendors.length === 0) {
            return res.status(404).json({ message: "No vendors found in this area" });
        }

        res.status(200).json(vendors);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

export default router;
