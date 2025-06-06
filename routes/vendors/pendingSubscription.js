import express from 'express';
import mongoose from "mongoose";
import dotenv from "dotenv";
import Subscriber from "../../models/subscriber.js";
import isauthenticated from '../../utils/authmiddlewware.js';

const router = express.Router();
dotenv.config();

router.get('/subscription/pending', isauthenticated, async (req, res) => {
  try {
    const Vendor_id = req.Vendor.Vendor_id;

    const subscriptionPending = await Subscriber.find({
      Vendor_id,
      subscriptionEndDate: { $gte: new Date() },
      pending: true
    });

    res.status(200).json({ subscriptionPending });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
