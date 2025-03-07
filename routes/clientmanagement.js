import express from "express";
import Subscriber from "../models/subscriber.js";
const router = express.Router();

router.get("/vendor/clients/active", async (req, res) => {
  res.json(activeClients);
  try {
    const activeClients = await Subscriber.find({ mealskipped: 0 });
    res.json({ success: true, data: activeClients });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error });
  }
});

router.get("/vendor/clients/paused", async (req, res) => {
  try {
    const pausedClients = await Subscriber.find({ mealskipped: { $gt: 2 } });
    res.json({ success: true, data: pausedClients });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error });
  }
});

router.get("/vendor/clients/exprired", async (req, res) => {
  try {
    const expiredsubscription = await Subscriber.find({
      subscriptionEndDate: { $lt: new Date() },
    });

    res.json({ success: true, data: expiredsubscription });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error });
  }
});

router.post("/vendor/clients/expiringsoon", async (req, res) => {
  try {
    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    const expiringsoon = await Subscriber.find({
      subscriptionEndDate: {
        $gte: new Date(), 
        $lte: threeDaysLater,
      },
      totalMeal: { $gt: 15 }, 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error });
  }
});
