import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Subscriber from '../../models/subscriber.js';
import isAuthenticated from '../../utils/clientauth.js';

const router = express.Router();
dotenv.config();

// Active subscriptions: subscriptionEndDate is in the future
router.get('/mysubscriptions/active', isAuthenticated, async (req, res) => {
  try {
    const subscriptions = await Subscriber.find({
      user_id: req.user.user_id,
      subscriptionEndDate: { $gt: new Date() }
    }).sort({ subscriptionEndDate: 1 });

    res.status(200).json({ subscriptiondetails: subscriptions });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching active subscriptions",
      error: error.message
    });
  }
});

// Expired subscriptions: subscriptionEndDate is in the past
router.get('/mysubscriptions/expired', isAuthenticated, async (req, res) => {
  try {
    const subscriptions = await Subscriber.find({
      user_id: req.user.user_id,
      subscriptionEndDate: { $lt: new Date() }
    }).sort({ subscriptionEndDate: -1 });

    res.status(200).json({ subscriptiondetails: subscriptions });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching expired subscriptions",
      error: error.message
    });
  }
});

// Expiring soon: between now and 3 days later
router.get('/mysubscriptions/expiringsoon', isAuthenticated, async (req, res) => {
  try {
    const now = new Date();
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days in ms

    const subscriptions = await Subscriber.find({
      user_id: req.user.user_id,
      subscriptionEndDate: { $gt: now, $lt: threeDaysLater }
    }).sort({ subscriptionEndDate: 1 });

    res.status(200).json({ subscriptiondetails: subscriptions });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching expiring soon subscriptions",
      error: error.message
    });
  }
});

export default router;
