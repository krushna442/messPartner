import express from "express";
import Subscriber from "../../models/subscriber.js";
const router = express.Router();

router.post('/delivery',async(req,res)=>{
    const {deliverygroup}= req.body;
    const deliverylist =await Subscriber.find({deliverygroup:deliverygroup   });
    res.status(201).json(deliverylist);
})




export default router;