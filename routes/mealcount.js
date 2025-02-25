import express from 'express';
import Subscriber from '../models/subscriber.js';
const router= express.Router();
import isauthenticated from '../utils/authmiddlewware.js';
router.get('/mealcount',isauthenticated,async(req,res)=>{
    const meals=await Subscriber.find({Vendor_id:req.Vendor.Vendor_id,mealOption:true})
    res.status(201).json({meals:meals});
})
export default router;