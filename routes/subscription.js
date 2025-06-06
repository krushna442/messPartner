import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Subscriber from "../models/subscriber.js";
import isAuthenticated from "../utils/clientauth.js";
import Vendor from "../models/Vendor.js"; // ✅ Correct (matches file name)
import Payment from "../models/paymentmodel.js";
const router = express.Router();
dotenv.config();

router.post("/subscribtion", isAuthenticated, async (req, res) => {
  const { user_id, Vendor_id, subscriptionType, mealtype, address1, address2 ,VendorData ,packageType, paymentId,paymentDetails } =req.body;
  if(!paymentId){
    res.status(300).json("paymentId is required")
  }
  const totalMeal = subscriptionType;
  try {
    const subscriptionDate = Date.now();
    const subscriptionEndDate = new Date(subscriptionDate + totalMeal * 86400000);

    const subscriber = new Subscriber({
      user_id: user_id,
      Vendor_id: Vendor_id,
      VendorData:VendorData,
      mealtype: mealtype,
      packageType:packageType,
      user_name: req.user.name,
      number: req.user.number,
      address1: address1,
      address2: address2,
      subscriptionId: user_id + Vendor_id,
      subscriptionType: subscriptionType,
      subscriptionDate: new Date(subscriptionDate),
      subscriptionEndDate: subscriptionEndDate,
      totalMeal: totalMeal,
      amount:amount,
      paymentId:paymentId,
      paymentDetails: paymentDetails // ✅ Add this line

    });

    await subscriber.save();
    // Update Vendor's mealToDeliver count
    const vendor = await Vendor.findOneAndUpdate(
      { Vendor_id },
      { $inc: { mealToDeliver: totalMeal * 2 } }, // ✅ Increase mealToDeliver
      { new: true }
    );

    res.status(201).json({ message: "Subscription added successfully", subscriber });
  } catch (error) {
    console.error("Subscription error:", error);
    res.status(500).json({ error: "Internal Server Error", error });
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
