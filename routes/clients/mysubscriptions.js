import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Subscriber from '../../models/subscriber.js';
import isAuthenticated from '../../utils/clientauth.js';
const router = express.Router();
dotenv.config();

router.get('/mysubscriptions', isAuthenticated, async (req, res) => {
    try {
      const subscriptions = await Subscriber.find({
        user_id: req.user.user_id,
        subscriptionEndDate: { $gt: new Date() } // Check if subscriptionEndDate is in the future
      });
  
      res.status(200).json({
        subscriptiondetails: subscriptions
      });
    } catch (error) {
      res.status(500).json({
        message: "Error fetching subscriptions",
        error: error.message
      });
    }
  });
export  default router;