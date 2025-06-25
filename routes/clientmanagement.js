import express from "express";
import Subscriber from "../models/subscriber.js";
import isauthenticated from "../utils/authmiddlewware.js";
const router = express.Router();

router.get("/vendor/clients/active",isauthenticated, async (req, res) => {
  try {
    const Vendor_id= req.Vendor.Vendor_id;
    const activeClients = await Subscriber.find({ mealskipped: 0 ,status: "accepted",'VendorData.Vendor_id':Vendor_id,  subscriptionEndDate: { $gte: Date.now() }
});
    res.json({ success: true, data: activeClients });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error });
  }
}); 


router.get("/vendor/clients/paused",isauthenticated, async (req, res) => {
  try {
    const Vendor_id= req.Vendor.Vendor_id;

    const pausedClients = await Subscriber.find({ mealskipped: { $gt: 2 } ,status: "accepted",'VendorData.Vendor_id':Vendor_id , subscriptionEndDate: { $gte: Date.now() }});
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
      subscriptionEndDate: { $lt: new Date() },status: "accepted",'VendorData.Vendor_id':Vendor_id,
    });

    res.json({ success: true, data: expiredsubscription });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error });
  }
});

router.get("/vendor/clients/expiringsoon", isauthenticated, async (req, res) => {
  try {
    const Vendor_id = req.Vendor.Vendor_id;

    // Set the start and end of the range properly
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Start of today

    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    threeDaysLater.setHours(23, 59, 59, 999); // End of the third day

    const expiringSoon = await Subscriber.find({
      subscriptionEndDate: {
        $gte: now, 
        $lte: threeDaysLater,
      },
      'VendorData.Vendor_id':Vendor_id,
      status: "accepted",
      totalMeal: { $gt: 15 }, 
    });

    res.json({ success: true, data: expiringSoon });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});


 export default router;