import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Subscriber from '../../models/subscriber.js';
import isAuthenticated from '../../utils/clientauth.js';
const router = express.Router();
dotenv.config();

router.get('/mysubscriptions',isAuthenticated,async(req,res)=>{
    res.status(200).json({
        subscriptiondetails :await Subscriber.find({user_id:req.user.user_id})

        });
})
export  default router;