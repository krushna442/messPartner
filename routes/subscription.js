import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Subscriber from "../models/subscriber.js";
import isAuthenticated from "../utils/clientauth.js";
import Vendor from "../models/Vendor.js"; // ✅ Correct (matches file name)
import Payment from "../models/paymentmodel.js";
import Transaction from "../models/transaction.js";
import MOnthlySummary from "../models/monthlySummary.js";
const router = express.Router();
dotenv.config();

router.post("/subscribtion", async (req, res) => {
  const { userData, subscriptionType, address1, address2, VendorData, paymentDetails } = req.body;
  
  try {
    // Calculate subscription end date
    const planDurationMs = subscriptionType.planDuration * 24 * 60 * 60 * 1000;
    const subscriptionEndDate = new Date(Date.now() + planDurationMs);

    // Create subscription with pending status
    const subscriber = new Subscriber({
      userData,
      VendorData,
      address1,
      address2,
      subscriptionId: `${userData.user_id}-${VendorData.Vendor_id}-${Date.now()}`,
      subscriptionType,
      subscriptionEndDate,
      paymentDetails,
      status: 'pending' // Set initial status as pending
    });

    await subscriber.save();

    res.status(201).json({ 
      message: "Subscription request created successfully",
      subscriber
    });

  } catch (error) {
    console.error("Subscription error:", error);
    res.status(500).json({ 
      error: "Internal Server Error",
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

router.post("/mealOff", isAuthenticated, async (req, res) => {
  try {
    const { _id } = req.body;
    const subscriber = await Subscriber.findById(_id);

    if (!subscriber) {
      return res.status(404).json({ error: "subscription not found" });
    }

    const updatedClient = await Subscriber.findOneAndUpdate(
      { _id },
      { $set: { mealOption: !subscriber.mealOption } },
      { new: true }
    );

    res.json({ message: "Meal option toggled", user: updatedClient });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error updating meal option", details: error.message });
  }
});

router.delete("/deletesubscription/:id", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;

    // Find subscription first
    const subscription = await Subscriber.findById(id);

    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    // Delete associated payment using paymentId
    if (subscription.paymentId) {
      await Payment.findByIdAndDelete(subscription.paymentId);
    }

    // Delete subscription
    await Subscriber.findByIdAndDelete(id);

    res.json({ message: "Subscription and related payment deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: "Failed to delete subscription", details: error.message });
  }
});


export default router;
