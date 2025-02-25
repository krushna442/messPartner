import express from 'express';
import mongoose from 'mongoose';
import cron from 'node-cron';
import Subscriber from '../models/subscriber.js';
import Mealrecord from '../models/mealrecord.js';
import isauthenticated from '../utils/authmiddlewware.js';

const router = express.Router();

// Function to fetch and update/store meal records
const fetchAndStoreMeals = async () => {
    try {
        const subscribers = await Subscriber.find({ mealOption: true });

        if (!subscribers.length) {
            console.log("No subscribers found.");
            return;
        }

        const vendorMeals = {};
        const currentTime = new Date();
        const today = new Date().toISOString().split("T")[0]; // Get YYYY-MM-DD

        subscribers.forEach(subscriber => {
            const { Vendor_id, user_id } = subscriber;
            if (!vendorMeals[Vendor_id]) {
                vendorMeals[Vendor_id] = { breakfast: [], lunch: [], dinner: [] };
            }

            const currentHour = currentTime.getHours();
            
            if (currentHour >= 4 && currentHour < 10) {
                vendorMeals[Vendor_id].breakfast.push(user_id);
            } else if (currentHour >= 10 && currentHour < 18) {
                vendorMeals[Vendor_id].lunch.push(user_id);
            } else {
                vendorMeals[Vendor_id].dinner.push(user_id);
            }
        });

        // Store or update data in Mealrecord collection
        for (const [vendorId, meals] of Object.entries(vendorMeals)) {
            const existingRecord = await Mealrecord.findOne({ Vendor_id: vendorId, date: today });

            if (existingRecord) {
                // Update existing record
                if (meals.breakfast.length) {
                    existingRecord.breakfast.push(...meals.breakfast);
                }
                if (meals.lunch.length) {
                    existingRecord.lunch.push(...meals.lunch);
                }
                if (meals.dinner.length) {
                    existingRecord.dinner.push(...meals.dinner);
                }
                await existingRecord.save();
                console.log(`Updated meal record for vendor ${vendorId}`);
            } else {
                // Create a new record
                await Mealrecord.create({
                    Vendor_id: vendorId,
                    date: today,
                    breakfast: meals.breakfast,
                    lunch: meals.lunch,
                    dinner: meals.dinner
                });
                console.log(`Created new meal record for vendor ${vendorId}`);
            }
        }

        console.log("Meal records updated successfully!");
    } catch (error) {
        console.error("Error fetching and storing meals:", error);
    }
};

router.get('/mealcount', isauthenticated, async (req, res) => {
    try {
        console.log("Vendor ID from request:", req.Vendor?.Vendor_id); // Debugging

        if (!req.Vendor || !req.Vendor.Vendor_id) {
            return res.status(400).json({ message: "Vendor ID missing in request." });
        }

        const mealdata = await Mealrecord.find({ Vendor_id: req.Vendor.Vendor_id });

        console.log("Fetched meal records:", mealdata); // Log the fetched data

        res.status(200).json(mealdata);
    } catch (error) {
        console.error("Error fetching meal records:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


// Schedule automatic execution at 4 AM, 12:20 PM, and 6 PM
cron.schedule('0 4,18 * * *', () => {
    console.log("Running scheduled meal count fetch at 4 AM & 6 PM...");
    fetchAndStoreMeals();
});

cron.schedule('36 12 * * *', () => {
    console.log("Running scheduled meal count fetch at 12:20 PM...");
    fetchAndStoreMeals();
});

export default router;
