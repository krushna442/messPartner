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
      Vendor_id: Vendor_id,
      subscriptionEndDate: { $gte: Date.now() }
    });

    const uniqueClients = [];
    const userIds = new Set();

    subscriptionDetails.forEach(client => {
      if (!userIds.has(client.user_id)) {
        uniqueClients.push(client);
        userIds.add(client.user_id);
      }
    });

    res.status(200).json({
      subscriptiondetails: uniqueClients
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
