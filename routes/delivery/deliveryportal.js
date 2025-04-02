import express from "express";
import jwt from "jsonwebtoken";
import Subscriber from "../../models/subscriber.js";
import Deliveryboy from "../../models/deliveryboy.js";
import Mealrecord from "../../models/mealrecord.js";
import isauthenticated from "../../utils/authmiddlewware.js";
import Client from "../../models/Client.js";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

router.post('/delivery/login', async (req, res) => {
    try {
        const { phone, Vendor_id } = req.body;
        const deliveryboy = await Deliveryboy.findOne({ phone, Vendor_id });

        if (!deliveryboy) {
            return res.status(400).json({ message: "Invalid phone number or vendor ID" });
        }

        const token = jwt.sign(
            { _id: deliveryboy._id, Vendor_id: deliveryboy.Vendor_id },
            process.env.JWTSECREAT
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "None",
            path: "/",
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });

        res.json({ message: "Login successful",deliveryboy});
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});

router.post('/delivery/register', async (req, res) => {
    try {
        const { name, phone, Vendor_id } = req.body;
        await Deliveryboy.create({ name, phone, Vendor_id });

        res.status(201).json({ message: "Delivery boy registered successfully" });
    } catch (error) {
        res.status(400).json({ message: "Error registering delivery boy", error: error.message });
    }
});



router.post('/delivery', isauthenticated, async (req, res) => {
    try {
        const { deliverygroup } = req.body;

        // Validate Vendor ID
        if (!req.Vendor || !req.Vendor.Vendor_id) {
            return res.status(400).json({ message: "Vendor ID missing in request." });
        }

        const today = new Date().toISOString().split("T")[0];
        const mealdata = await Mealrecord.findOne({ Vendor_id: req.Vendor.Vendor_id, date: today });

        if (!mealdata) {
            return res.status(404).json({ message: "No meal data found for today." });
        }

        // Get current time
        const currentHour = new Date().getHours();
        let userIds = [];

        if (currentHour >= 4 && currentHour < 10) {
            userIds = mealdata.breakfast;
        } else if (currentHour >= 10 && currentHour < 18) {
            userIds = mealdata.lunch;
        } else {
            userIds = mealdata.dinner;
        }

        if (!userIds.length) {
            return res.status(200).json({ message: "No users found for this meal time." });
        }

        // Fetch subscribers who belong to the provided delivery group and match user IDs
        const subscribers = await Subscriber.find({
            user_id: { $in: userIds },
            deliverygroup: deliverygroup,
            Vendor_id: req.Vendor.Vendor_id
        });

        if (!subscribers.length) {
            return res.status(404).json({ message: "No subscribers found for this delivery group." });
        }

        // Fetch user details from User collection
        // const userDetails = await Client.find({
        //     user_id: { $in: subscribers.map(sub => sub.user_id) }
        // }).select("-password"); // Exclude password for security

        res.status(200).json(subscribers);

    } catch (error) {
        console.error("Error fetching delivery list:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});


export default router;
