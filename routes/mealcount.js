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
const currentHour = new Date().getUTCHours(); // Use UTC hours for meal period
  if (currentHour >= 4 && currentHour < 10) return 'breakfast';
  if (currentHour >= 10 && currentHour < 16) return 'lunch';
  return 'dinner';
};

// Main meal processing function
const fetchAndStoreMeals = async () => {
  try {
const today = new Date().toISOString().split("T")[0]; // Already UTC
    const currentMealPeriod = getCurrentMealPeriod();
console.log("Server Time:", new Date(), "UTC Hour:", new Date().getUTCHours());
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
console.log("Active Subscribers Count:", activeSubscribers.length);
    if (!activeSubscribers.length) {
      return { success: true, message: "No active subscribers found" };
    }

    // 3. Prepare bulk operations
    const bulkSubscriberUpdates = [];
    const mealRecordUpdates = {};

    for (const subscriber of activeSubscribers) {
      const Vendor_id = subscriber.VendorData?.Vendor_id;
      if (!Vendor_id) continue;

      const subscriptionType = subscriber.subscriptionType;
      const subscriptionTypeId = subscriptionType?._id;
      
      const deliveryTypes = subscriptionType?.deliveryTypes || ['breakfast', 'lunch', 'dinner'];
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
          planName: subscriptionType?.planName || 'Unknown',
          planCategory: subscriptionType?.planCategory || 'Regular',
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
console.log("Mealrecord Update Operations:", updateOps); // Log the ops

     const bulkWriteResult= await Mealrecord.bulkWrite(updateOps);
     console.log("BulkWrite Result:", bulkWriteResult);
    }

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
      message: "Failed to fetch meal records"
    });
  }
});

// API Endpoint to manually trigger update
router.post("/update-meals", isauthenticated, async (req, res) => {
  try {
      console.log("Vendor ID:", req.Vendor?.Vendor_id); // Log Vendor_id
  if (!req.Vendor?.Vendor_id) {
    return res.status(400).json({ success: false, message: "Vendor ID missing" });
  }
        console.log("DB Connection State:", mongoose.connection.readyState); // 1 = connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({ success: false, message: "DB not connected" });
    }
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

    const today = new Date().toISOString().split("T")[0];
    const updatedRecord = await Mealrecord.findOne({
      Vendor_id: req.Vendor.Vendor_id,
      date: today
    }).lean();

    res.status(200).json({
      success: true,
      message: "Meal counts updated",
      data: updatedRecord
    });

  } catch (error) {
    console.error("Error updating meals:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update meals"
    });
  }
});

// Scheduled jobs
cron.schedule("0 5,11,17 * * *", async () => {
  try {
    await fetchAndStoreMeals();
  } catch (error) {
    console.error("Error in scheduled meal update:", error);
  }
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
    res.status(200).json({ 
      message: "Delivery address added successfully", 
      matchedDocuments: result.matchedCount, 
      modifiedDocuments: result.modifiedCount 
    });
  } catch (error) {
    console.error("Error adding delivery group:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;