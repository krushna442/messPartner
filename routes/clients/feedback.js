import express from 'express';
import Feedback from '../../models/feedbackmodel.js';
import Vendor from '../../models/Vendor.js';
import Client from '../../models/Client.js';
import isAuthenticated from '../../utils/clientauth.js';
import isauthenticated from '../../utils/authmiddlewware.js';
import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const router = express.Router();
router.post('/user/feedback',isAuthenticated,async(req,res)=>{
    try {
    const {Vendor_id,feedback,rating} = req.body;
    const imageBase64 = req.file ? req.file.buffer.toString("base64") : null;

   const {user_id,name}= req.user;
    await Feedback.create({Vendor_id,feedback,rating,user_id,name,image:imageBase64});
    res.status(200).json({message:"Feedback sent successfully"});
    } catch (error) {
        res.status(500).json({message:"Error in sending feedback",error});
        }
})

router.get ('/show/feedback',isAuthenticated,async(req,res)=>{
    try{
    const {user_id}= req.user;
    const feedback = await Feedback.find({user_id});
    res.status(200).json({feedback});
    }catch(error){
        res.status(500).json({message:error.message});
    }
})

router.get('/vendor/show/feedback',isauthenticated,async(req,res)=>{
    try{
        const {Vendor_id}= req.Vendor;
        const feedback = await Feedback.find({Vendor_id});
        res.status(200).json({feedback});
        }catch(error){
            res.status(500).json({message:error.message,error});
            }
})

router.post('/details',async(req,res)=>{
    try{
        const {user_id,Vendor_id}= req.body;
        if (user_id){
            const client = await Client.findOne({user_id});
            res.json(client);
        }
        if(Vendor_id){
            const vendor = await Vendor.findOne({Vendor_id});
            res.json(vendor);
        }
        }catch(error){
            res.status(500).json({message:error.message});
        }
    })

    export default router;