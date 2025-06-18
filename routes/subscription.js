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
  const { userData, subscriptionType, address1, address2, VendorData, paymentDetails } = req.body;
  const { Vendor_id } = req.Vendor;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Calculate subscription end date
    const planDurationMs = subscriptionType.planDuration * 24 * 60 * 60 * 1000;
    const subscriptionEndDate = new Date(Date.now() + planDurationMs);

    // 2. Create subscription
    const subscriber = new Subscriber({
      userData,
      VendorData,
      address1,
      address2,
      subscriptionId: `${userData.user_id}-${VendorData.Vendor_id}-${Date.now()}`,
      subscriptionType,
      subscriptionEndDate,
      paymentDetails
    });

    await subscriber.save({ session });

    // 3. Update Vendor's subscription type subscribers count
    await Vendor.findByIdAndUpdate(
      VendorData._id,
      { 
        $inc: { 
          // Increment subscribers count for this specific subscription type
          "subscriptiontype.$[elem].subscribers": 1 
        }
      },
      { 
        new: true,
        session,
        arrayFilters: [{ "elem._id": subscriptionType._id }] // Match the specific subscription type
      }
    );

    // 4. Create transaction record
    const transaction = await Transaction.create([{
      Vendor_id,
      type: 'income',
      amount: subscriptionType.basePrice,
      category: 'subscription_payment',
      description: `Subscription payment for ${subscriptionType.planName} plan`,
      status: 'completed',
      paymentMethod: 'upi',
      attachment: paymentDetails.screenshot,
      date: new Date(),
      recipient: userData.name
    }], { session });

    // 5. Update monthly summary (same as before)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    let summary = await MonthlySummary.findOne({
      vendorId: Vendor_id,
      createdAt: { $gte: startOfMonth }
    }).session(session);

    if (!summary) {
      const startOfLastMonth = new Date(startOfMonth);
      startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);

      const lastMonthSummary = await MonthlySummary.findOne({
        vendorId: Vendor_id,
        createdAt: {
          $gte: startOfLastMonth,
          $lt: startOfMonth
        }
      }).session(session);

      const lastTotalEarnings = lastMonthSummary ? lastMonthSummary.totalEarnings : 0;

      summary = new MonthlySummary({
        vendorId: Vendor_id,
        totalIncome: subscriptionType.basePrice,
        totalExpenses: 0,
        netProfit: subscriptionType.basePrice,
        totalEarnings: lastTotalEarnings + subscriptionType.basePrice,
        updatedAt: new Date()
      });
    } else {
      summary.totalIncome += subscriptionType.basePrice;
      summary.netProfit = summary.totalIncome - summary.totalExpenses;
      
      if (!summary.totalEarnings) {
        const startOfLastMonth = new Date(startOfMonth);
        startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);

        const lastMonthSummary = await MonthlySummary.findOne({
          vendorId: Vendor_id,
          createdAt: {
            $gte: startOfLastMonth,
            $lt: startOfMonth
          }
        }).session(session);

        summary.totalEarnings = (lastMonthSummary ? lastMonthSummary.totalEarnings : 0) + summary.totalIncome;
      } else {
        summary.totalEarnings += subscriptionType.basePrice;
      }
      
      summary.updatedAt = new Date();
    }

    await summary.save({ session });

    // Commit all operations
    await session.commitTransaction();

    res.status(201).json({ 
      message: "Subscription created and transaction recorded successfully",
      subscriber,
      transaction: transaction[0],
      monthlySummary: summary
    });

  } catch (error) {
    await session.abortTransaction();
    console.error("Subscription error:", error);
    res.status(500).json({ 
      error: "Internal Server Error",
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  } finally {
    session.endSession();
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
