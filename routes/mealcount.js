import express from "express";
import mongoose from "mongoose";
import cron from "node-cron";
import Subscriber from "../models/subscriber.js";
import Mealrecord from "../models/mealrecord.js";
import isauthenticated from "../utils/authmiddlewware.js";
import Client from "../models/Client.js";

const router = express.Router();

// Function to fetch and update/store meal records
const fetchAndStoreMeals = async () => {
  try {
    const mealoffsubscribers = await Subscriber.find({ mealOption: false });

    for (const subscriber of mealoffsubscribers) {
        subscriber.mealskipped += 1;
        subscriber.subscriptionEndDate = new Date(subscriber.subscriptionEndDate.getTime() + 8 * 60 * 60 * 1000);
    
        await subscriber.save();
    }
    

    const subscribers = await Subscriber.find({ mealOption: true });

    if (!subscribers.length) {
      console.log("No subscribers found.");
      return;
    }

    const vendorMeals = {};
    const currentTime = new Date();
    const today = new Date().toISOString().split("T")[0]; // Get YYYY-MM-DD

    subscribers.forEach((subscriber) => {
      subscriber.mealskipped = 0;
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
      const existingRecord = await Mealrecord.findOne({
        Vendor_id: vendorId,
        date: today,
      });

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
          dinner: meals.dinner,
        });
        console.log(`Created new meal record for vendor ${vendorId}`);
      }
    }

    console.log("Meal records updated successfully!");
  } catch (error) {
    console.error("Error fetching and storing meals:", error);
  }
};

router.get("/mealcount", isauthenticated, async (req, res) => {
  try {
    if (!req.Vendor || !req.Vendor.Vendor_id) {
      return res.status(400).json({ message: "Vendor ID missing in request." });
    }

    const currentDate = new Date();
    const startOfDay = new Date(currentDate.setHours(0, 0, 0, 0)); // 00:00:00
    const endOfDay = new Date(currentDate.setHours(23, 59, 59, 999)); // 23:59:59
    
    const mealdata = await Mealrecord.find({
      Vendor_id: req.Vendor.Vendor_id,
      date: { $gte: startOfDay, $lte: endOfDay } // Filter by today's date
    });
    
    console.log("Fetched meal records:", mealdata); // Log the fetched data

    res.status(200).json(mealdata);
  } catch (error) {
    console.error("Error fetching meal records:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
router.post("/userdetail", async (req, res) => {
  const { user_id } = req.body;
  const user = await Client.findOne({ user_id });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  res.status(200).json(user);
});

cron.schedule("0 4,18 * * *", () => {
  console.log("Running scheduled meal count fetch at 4 AM & 6 PM...");
  fetchAndStoreMeals();
});

cron.schedule("16 11 * * *", () => {
  console.log("Running scheduled meal count fetch at 12:20 PM...");
  fetchAndStoreMeals();
});

export default router;
