import express from 'express';
import mongoose from "mongoose";
import dotenv from "dotenv";
import Subscriber from "../models/subscriber.js";
import isauthenticated from '../utils/authmiddlewware.js';


 const router = express.Router();
 dotenv.config();
router.get('/myclients', isauthenticated, async (req, res) => {
  try {
    const Vendor_id = req.Vendor.Vendor_id;

    const subscriptionDetails = await Subscriber.find({
     'VendorData.Vendor_id':Vendor_id,
      subscriptionEndDate: { $gte: Date.now() },
      status: "accepted",
    });

    res.status(200).json({
      subscriptiondetails: subscriptionDetails
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});
router.get('/allclients', isauthenticated, async (req, res) => {
  try {
    const Vendor_id = req.Vendor.Vendor_id;

    const subscriptionDetails = await Subscriber.find({
      'VendorData.Vendor_id':Vendor_id,
      status: "accepted",
    });

    res.status(200).json({
      subscriptiondetails: subscriptionDetails
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

 router.get('/myclients/mealtype',isauthenticated,async(req,res)=>{
    const veg= await Subscriber.find({Vendor_id:req.Vendor.Vendor_id,mealtype:"veg",  subscriptionEndDate: { $gte: Date.now() }});
    const nonveg= await Subscriber.find({Vendor_id:req.Vendor.Vendor_id,mealtype:"non veg" , subscriptionEndDate: { $gte: Date.now() }});
res.status(200).json({veg,nonveg});

})

 export default router;
