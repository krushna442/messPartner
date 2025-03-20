import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Subscriber from '../models/subscriber.js';
import isAuthenticated from '../utils/clientauth.js'
const router = express.Router();
dotenv.config();



router.post('/subscribtion',isAuthenticated, async(req,res)=>{
  const { user_id, Vendor_id,subscriptionType, mealtype ,address1,address2} = req.body;
  const  totalMeal=subscriptionType;
  try {
      const subscriptionDate = Date.now();
      const subscriptionEndDate = subscriptionDate + totalMeal * 86400000;
  
      const subscriber = new Subscriber({
          user_id: user_id,
          Vendor_id: Vendor_id,
          user_name: req.user.name,
          number: req.user.number,
          address1:address1,
          address2:address2,
          subscriptionId: user_id + Vendor_id,
          subscriptionType: subscriptionType,
          mealType: mealtype,
          subscriptionDate: new Date(subscriptionDate), 
          subscriptionEndDate:subscriptionEndDate,
          totalMeal: totalMeal,
      });
  
      await subscriber.save();
      res.status(201).json({ message: "Subscription added successfully", subscriber });
  } catch (error) {
      console.error("Subscription error:", error);
      res.status(500).json({ error: "Internal Server Error",error });
  }
  
    
});


router.post("/mealOff", async (req, res) => {
  try {
      const { user_id } = req.body;

      // Find the user first
      const subscriber = await Subscriber.findOne({ clientId: user_id });

      if (!subscriber) {
          return res.status(404).json({ error: "User not found" });
      }

      // Toggle mealOption (true ↔ false)
      const updatedClient = await Subscriber.findOneAndUpdate(
          { clientId: user_id },
          { $set: { mealOption: !subscriber.mealOption } },  // ✅ Toggles true ↔ false
          { new: true }  // ✅ Returns the updated document
      );

      res.json({ message: "Meal option toggled", user: updatedClient });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error updating meal option", details: error.message });
  }
});

 export default router;