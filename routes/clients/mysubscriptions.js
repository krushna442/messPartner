import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Subscriber from '../../models/subscriber.js';
import isAuthenticated from '../../utils/clientauth.js';
const router = express.Router();
dotenv.config();

router.get('/mysubscriptions',isAuthenticated,async(req,res)=>{
    // router.post("/home", isAuthenticated, async (req, res) => {
    //     res.status(200).json({
    //       message: "This is the home page",
    //       clientDetails :await Client.findById(req.user._id)   
    //     });
    //   });
    res.status(200).json({
        subscriptiondetails :await Subscriber.find({clientId:req.user.user_id})

        });
})
export  default router;