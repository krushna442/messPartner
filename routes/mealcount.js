import express from "express";
import mongoose from "mongoose";
import cron from "node-cron";
import Subscriber from "../models/subscriber.js";
import Mealrecord from "../models/mealrecord.js";
import isauthenticated from "../utils/authmiddlewware.js";
import Client from "../models/Client.js";

const router = express.Router();




// Helper function to get current meal period
const getCurrentMealPeriod = () => {
  const currentHour = new Date().getHours();
  if (currentHour >= 4 && currentHour < 10) return 'breakfast';
  if (currentHour >= 10 && currentHour < 16) return 'lunch';
  return 'dinner';
};

// Main meal processing function
const fetchAndStoreMeals = async () => {
  try {
    console.log("Running scheduled meal count fetch...");
    const today = new Date().toISOString().split("T")[0];
    const currentMealPeriod = getCurrentMealPeriod();

    // 1. Process skipped meals
    await Subscriber.updateMany(
      { 
        mealOption: false,
        status: "accepted",
        subscriptionEndDate: { $gte: new Date() } 
      },
      { 
        $inc: { mealskipped: 1 },
        $set: { 
          subscriptionEndDate: new Date(new Date().getTime() + 8 * 60 * 60 * 1000),
          updatedAt: new Date()
        }
      }
    );

    // 2. Process active subscribers
    const activeSubscribers = await Subscriber.find({ 
      mealOption: true, 
      status: "accepted",
      subscriptionEndDate: { $gte: new Date() }
    }).populate('subscriptionType');

    if (!activeSubscribers.length) {
      console.log("No active subscribers found.");
      return { success: true, message: "No active subscribers found" };
    }

    // 3. Prepare bulk operations
    const bulkSubscriberUpdates = [];
    const mealRecordUpdates = {};

    for (const subscriber of activeSubscribers) {
      const Vendor_id = subscriber.VendorData?.Vendor_id;
      if (!Vendor_id) continue;

      const subscriptionType = subscriber.subscriptionType;
      const subscriptionTypeId = subscriptionType._id;
      const deliveryTypes = subscriptionType.deliveryTypes || [];
      
      // Skip if not current meal period
      if (!deliveryTypes.map(t => t.toLowerCase()).includes(currentMealPeriod)) {
        continue;
      }

      // Prepare subscriber update
      const mealField = `received${currentMealPeriod.charAt(0).toUpperCase() + currentMealPeriod.slice(1)}`;
      bulkSubscriberUpdates.push({
        updateOne: {
          filter: { _id: subscriber._id },
          update: {
            $inc: { [mealField]: 1 },
            $set: { 
              mealskipped: 0,
              updatedAt: new Date()
            }
          }
        }
      });

      // Prepare meal record update
      if (!mealRecordUpdates[Vendor_id]) {
        mealRecordUpdates[Vendor_id] = {};
      }
      
      if (!mealRecordUpdates[Vendor_id][subscriptionTypeId]) {
        mealRecordUpdates[Vendor_id][subscriptionTypeId] = {
          planName: subscriptionType.planName,
          planCategory: subscriptionType.planCategory,
          subscribers: [],
          total: 0
        };
      }

      mealRecordUpdates[Vendor_id][subscriptionTypeId].subscribers.push(subscriber.toObject());
      mealRecordUpdates[Vendor_id][subscriptionTypeId].total += 1;
    }

    // 4. Execute bulk subscriber updates
    if (bulkSubscriberUpdates.length > 0) {
      await Subscriber.bulkWrite(bulkSubscriberUpdates);
    }

    // 5. Update meal records
    for (const [vendorId, subTypes] of Object.entries(mealRecordUpdates)) {
      const updateOps = Object.entries(subTypes).map(([subTypeId, data]) => ({
        updateOne: {
          filter: { 
            Vendor_id: vendorId, 
            date: today,
            "subscriptionTypes.subscriptionTypeId": new mongoose.Types.ObjectId(subTypeId)
          },
          update: {
            $set: {
              [`subscriptionTypes.$.meals.${currentMealPeriod}`]: data.subscribers,
              "subscriptionTypes.$.totalMeals": data.total,
              "subscriptionTypes.$.planName": data.planName,
              "subscriptionTypes.$.planCategory": data.planCategory,
              updatedAt: new Date()
            }
          }
        }
      }));

      // Add upsert operation for new records
      updateOps.push({
        updateOne: {
          filter: { Vendor_id: vendorId, date: today },
          update: {
            $setOnInsert: {
              Vendor_id: vendorId,
              date: today,
              subscriptionTypes: Object.entries(subTypes).map(([id, data]) => ({
                subscriptionTypeId: id,
                planName: data.planName,
                planCategory: data.planCategory,
                meals: { [currentMealPeriod]: data.subscribers },
                totalMeals: data.total
              })),
              createdAt: new Date(),
              updatedAt: new Date()
            }
          },
          upsert: true
        }
      });

      await Mealrecord.bulkWrite(updateOps);
    }

    console.log(`Successfully updated ${currentMealPeriod} records`);
    return { success: true, message: `Updated ${currentMealPeriod} records` };

  } catch (error) {
    console.error("Error in fetchAndStoreMeals:", error);
    return { success: false, message: error.message };
  }
};

// API Endpoint to get meal counts
router.get("/mealcount", isauthenticated, async (req, res) => {
  try {
    if (!req.Vendor?.Vendor_id) {
      return res.status(400).json({ success: false, message: "Vendor ID missing" });
    }
    
    const today = new Date().toISOString().split("T")[0];
    const record = await Mealrecord.findOne({
      Vendor_id: req.Vendor.Vendor_id,
      date: today
    }).lean();

    res.status(200).json({
      success: true,
      data: record || null,
      lastUpdated: record?.updatedAt
    });

  } catch (error) {
    console.error("Error fetching meal records:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch meal records",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

// API Endpoint to manually trigger update
router.post("/update-meals", isauthenticated, async (req, res) => {
  try {
    // Rate limiting - check last update
    const lastUpdate = await Mealrecord.findOne({
      Vendor_id: req.Vendor.Vendor_id
    }).sort({ updatedAt: -1 });

    if (lastUpdate && (Date.now() - lastUpdate.updatedAt < 30 * 60 * 1000)) {
      return res.status(200).json({
        success: true,
        message: "Meals updated recently",
        nextUpdate: new Date(lastUpdate.updatedAt.getTime() + 30 * 60 * 1000),
        data: lastUpdate
      });
    }

    const result = await fetchAndStoreMeals();
    if (!result.success) {
      return res.status(500).json(result);
    }

    const updatedRecord = await Mealrecord.findOne({
      Vendor_id: req.Vendor.Vendor_id,
      date: new Date().toISOString().split("T")[0]
    }).lean();

    res.status(200).json({
      success: true,
      message: "Meal counts updated",
      data: updatedRecord
    });

  } catch (error) {
    console.error("Error in manual update:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update meals",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

// Scheduled jobs
cron.schedule("0 5,11,17 * * *", async () => {
  console.log("Running scheduled meal update at", new Date().toISOString());
  await fetchAndStoreMeals();
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
