import express from "express";
import mongoose from "mongoose";
import cron from "node-cron";
import Subscriber from "../models/subscriber.js";
import Mealrecord from "../models/mealrecord.js";
import isauthenticated from "../utils/authmiddlewware.js";
import Client from "../models/Client.js";

const router = express.Router();

// Function to fetch and update/store meal records
// const fetchAndStoreMeals = async () => {
//   try {
//     const mealoffsubscribers = await Subscriber.find({ mealOption: false });

//     for (const subscriber of mealoffsubscribers) {
//       subscriber.mealskipped += 1;
//       subscriber.subscriptionEndDate = new Date(subscriber.subscriptionEndDate.getTime() + 8 * 60 * 60 * 1000);
//       await subscriber.save();
//     }

//     const subscribers = await Subscriber.find({ mealOption: true });
//     if (!subscribers.length) {
//       console.log("No subscribers found.");
//       return;
//     }

//     const vendorMeals = {};
//     const currentTime = new Date();
//     const today = new Date().toISOString().split("T")[0];

//     for (const subscriber of subscribers) {
//       subscriber.mealskipped = 0;
//       const { Vendor_id, user_id } = subscriber;
//       if (!vendorMeals[Vendor_id]) {
//         vendorMeals[Vendor_id] = { breakfast: [], lunch: [], dinner: [] };
//       }
//       const currentHour = currentTime.getHours();

//       if (currentHour >= 4 && currentHour < 10) {
//         vendorMeals[Vendor_id].breakfast.push(user_id);
//         subscriber.receivedBreakfast += 1;
//       } else if (currentHour >= 10 && currentHour < 18) {
//         vendorMeals[Vendor_id].lunch.push(user_id);
//         subscriber.receivedLunch += 1;
//       } else {
//         vendorMeals[Vendor_id].dinner.push(user_id);
//         subscriber.receivedDinner += 1;
//       }
//       await subscriber.save();
//     }

//     for (const [vendorId, meals] of Object.entries(vendorMeals)) {
//       const existingRecord = await Mealrecord.findOne({ Vendor_id: vendorId, date: today });

//       if (existingRecord) {
//         if (meals.breakfast.length) existingRecord.breakfast.push(...meals.breakfast);
//         if (meals.lunch.length) existingRecord.lunch.push(...meals.lunch);
//         if (meals.dinner.length) existingRecord.dinner.push(...meals.dinner);
//         await existingRecord.save();
//       } else {
//         await Mealrecord.create({
//           Vendor_id: vendorId,
//           date: today,
//           breakfast: meals.breakfast,
//           lunch: meals.lunch,
//           dinner: meals.dinner,
//         });
//       }
//     }
//     console.log("Meal records updated successfully!");
//   } catch (error) {
//     console.error("Error fetching and storing meals:", error);
//   }
// };

const fetchAndStoreMeals = async () => {
  try {
      console.log("Running scheduled meal count fetch...");

      // 1️⃣ Fetch Subscribers Who Skipped Meals (mealOption: false)
      const mealOffSubscribers = await Subscriber.find({ mealOption: false });

      for (const subscriber of mealOffSubscribers) {
          subscriber.mealskipped += 1;
          subscriber.subscriptionEndDate = new Date(
              subscriber.subscriptionEndDate.getTime() + 8 * 60 * 60 * 1000
          );
          await subscriber.save();
      }

      // 2️⃣ Fetch Active Subscribers (mealOption: true)
      const subscribers = await Subscriber.find({ mealOption: true });

      if (!subscribers.length) {
          console.log("No active subscribers found.");
          return;
      }

      const vendorMeals = {}; // Stores grouped data
      const currentTime = new Date();
      const today = new Date().toISOString().split("T")[0];

      for (const subscriber of subscribers) {
          subscriber.mealskipped = 0;

          const { Vendor_id, user_id, mealtype } = subscriber;

          // Initialize vendor data if not present
          if (!vendorMeals[Vendor_id]) {
              vendorMeals[Vendor_id] = {
                  breakfast: { veg: [], nonVeg: [] },
                  lunch: { veg: [], nonVeg: [] },
                  dinner: { veg: [], nonVeg: [] },
                  totalmeal: 0, // ✅ Now correctly inside each vendor object
              };
          }

          const currentHour = currentTime.getHours();
          const isVeg = mealtype === "veg";

          if (currentHour >= 4 && currentHour < 10) {
              // Breakfast Time
              isVeg
                  ? vendorMeals[Vendor_id].breakfast.veg.push(user_id)
                  : vendorMeals[Vendor_id].breakfast.nonVeg.push(user_id);
              subscriber.receivedBreakfast += 1;
          } else if (currentHour >= 10 && currentHour < 18) {
              // Lunch Time
              isVeg
                  ? vendorMeals[Vendor_id].lunch.veg.push(user_id)
                  : vendorMeals[Vendor_id].lunch.nonVeg.push(user_id);
              subscriber.receivedLunch += 1;
          } else {
              // Dinner Time
              isVeg
                  ? vendorMeals[Vendor_id].dinner.veg.push(user_id)
                  : vendorMeals[Vendor_id].dinner.nonVeg.push(user_id);
              subscriber.receivedDinner += 1;
          }

          // ✅ Increment totalmeal count inside the vendor’s object
          vendorMeals[Vendor_id].totalmeal += 1;

          await subscriber.save();
      }

      // 3️⃣ Store Grouped Meal Records
      for (const [vendorId, meals] of Object.entries(vendorMeals)) {
          const existingRecord = await Mealrecord.findOne({
              Vendor_id: vendorId,
              date: today,
          });

          if (existingRecord) {
              // Append new subscribers to existing records
              if (meals.breakfast.veg.length)
                  existingRecord.breakfast.veg.push(...meals.breakfast.veg);
              if (meals.breakfast.nonVeg.length)
                  existingRecord.breakfast.nonVeg.push(...meals.breakfast.nonVeg);
              if (meals.lunch.veg.length)
                  existingRecord.lunch.veg.push(...meals.lunch.veg);
              if (meals.lunch.nonVeg.length)
                  existingRecord.lunch.nonVeg.push(...meals.lunch.nonVeg);
              if (meals.dinner.veg.length)
                  existingRecord.dinner.veg.push(...meals.dinner.veg);
              if (meals.dinner.nonVeg.length)
                  existingRecord.dinner.nonVeg.push(...meals.dinner.nonVeg);
              
              existingRecord.totalmeal += meals.totalmeal; // ✅ Updating total meal count
              await existingRecord.save();
          } else {
              // Create new meal record
              await Mealrecord.create({
                  Vendor_id: vendorId,
                  date: today,
                  breakfast: meals.breakfast,
                  lunch: meals.lunch,
                  dinner: meals.dinner,
                  totalmeal: meals.totalmeal, // ✅ Storing total meal count
              });
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
    
    const today = new Date().toISOString().split("T")[0];
    const mealdata = await Mealrecord.find({ Vendor_id: req.Vendor.Vendor_id, date: today });
    res.status(200).json(mealdata);
  } catch (error) {
    console.error("Error fetching meal records:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/userdetail", async (req, res) => {
  try {
    const { user_id } = req.body;
    const user = await Client.findOne({ user_id });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

cron.schedule("0 4,18 * * *", () => {
  console.log("Running scheduled meal count fetch at 4 AM & 6 PM...");
  fetchAndStoreMeals();
});

cron.schedule("17 12 * * *", () => {
  console.log("Running scheduled meal count fetch at 11:48 AM...");
  fetchAndStoreMeals();
});

router.post("/addgroup", async (req, res) => {
  try {
    const { user_id, deliverygroup } = req.body;
    if (!user_id || !deliverygroup) {
      return res.status(400).json({ message: "Client ID and delivery address are required" });
    }

    const result = await Subscriber.updateMany({ user_id }, { $set: { deliverygroup } });
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Client not found" });
    }
    res.status(200).json({ message: "Delivery address added successfully", matchedDocuments: result.matchedCount, modifiedDocuments: result.modifiedCount });
  } catch (error) {
    console.error("Error adding delivery group:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
