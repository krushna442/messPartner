import express from "express";
import cookieParser from "cookie-parser";
import Vendor from "../models/Vendor.js";
import isauthenticated from "../utils/authmiddlewware.js";

const router = express.Router();
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
router.use(cookieParser());

router.post('/updateprofile/shopdetail', isauthenticated, async (req, res) => {
    try {
        const vendorDetails = await Vendor.findOne({ Vendor_id: req.Vendor.Vendor_id });

        if (!vendorDetails) {
            return res.status(404).json({ message: "Vendor not found" });
        }

        const { shopname, shoplocation, location} = req.body;

        if (!shopname || !shoplocation || !location) {
            return res.status(400).json({ message: "Please fill all the fields" });
        }

        // Update vendor details
        vendorDetails.shopname = shopname;
        vendorDetails.shoplocation = shoplocation;
        vendorDetails.location = location;
       

        // Save updated vendor details
        await vendorDetails.save();

        return res.status(200).json({ message: "Profile updated successfully", vendor: vendorDetails });

    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});

router.post ('/updateprofile/contact', isauthenticated, async (req, res) => {
    try {
        const vendorDetails = await Vendor.findOne({ Vendor_id: req.Vendor.Vendor_id });
        if (!vendorDetails) {
            return res.status(404).json({ message: "Vendor not found" });
            }
            const { contactmobile, whatsapp } = req.body;
            if (!contactmobile || !whatsapp) {
                return res.status(400).json({ message: "Please fill all the fields" });
                }
                // Update vendor details
                vendorDetails.contactmobile = contactmobile;
                vendorDetails.whatsapp= whatsapp;
                await vendorDetails.save();
                res.status(201).json({message:"contact information added succesfully",vendorDetails:vendorDetails})
            }catch(error) {
                return res.status(500).json({ message: "Internal Server Error", error: error.messag})
            }
        });

    
export default router;
