import express from "express";
import Subscriber from "../models/subscriber.js";
import isauthenticated from "../utils/authmiddlewware.js";
const router = express.Router();

router.get("/vendor/clients/active",isauthenticated, async (req, res) => {
  try {
    const Vendor_id= req.Vendor.Vendor_id;
    const activeClients = await Subscriber.find({ mealskipped: 0 ,Vendor_id:Vendor_id});
    res.json({ success: true, data: activeClients });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error });
  }
});

router.get("/vendor/clients/paused",isauthenticated, async (req, res) => {
  try {
    const Vendor_id= req.Vendor.Vendor_id;

    const pausedClients = await Subscriber.find({ mealskipped: { $gt: 2 } ,Vendor_id:Vendor_id});
    res.json({ success: true, data: pausedClients });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error });
  }
});

router.get("/vendor/clients/exprired",isauthenticated, async (req, res) => {
  try {
    const Vendor_id= req.Vendor.Vendor_id;

    const expiredsubscription = await Subscriber.find({
      subscriptionEndDate: { $lt: new Date() },Vendor_id:Vendor_id
    });

    res.json({ success: true, data: expiredsubscription });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error });
  }
});

router.post("/vendor/clients/expiringsoon",isauthenticated, async (req, res) => {
  try {
    const Vendor_id= req.Vendor.Vendor_id;

    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    const expiringsoon = await Subscriber.find({
      subscriptionEndDate: {
        $gte: new Date(), 
        $lte: threeDaysLater,
      },
      Vendor_id:Vendor_id,
      totalMeal: { $gt: 15 }, 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error });
  }
});

 export default router;