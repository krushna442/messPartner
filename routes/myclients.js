import express from 'express';
import mongoose from "mongoose";
import dotenv from "dotenv";
import Subscriber from "../models/subscriber.js";
import isauthenticated from '../utils/authmiddlewware.js';


 const router = express.Router();
 dotenv.config();
 router.get('/myclients',isauthenticated,async(req,res)=>{
    
    res.status(200).json({
        subscriptiondetails :await Subscriber.find({Vendor_id:req.Vendor.Vendor_id})

        })
 })
 router.get('/myclients/mealtype',isauthenticated,async(req,res)=>{
    const veg= await Subscriber.find({Vendor_id:req.Vendor.Vendor_id,mealtype:"veg"});
    const nonveg= await Subscriber.find({Vendor_id:req.Vendor.Vendor_id,mealtype:"non veg"});
res.status(200).json({veg,nonveg});

})

 export default router;
