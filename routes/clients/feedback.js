import express from 'express';
import multer from 'multer';
import Feedback from '../../models/feedbackmodel.js';
import Vendor from '../../models/Vendor.js';
import Client from '../../models/Client.js';
import isAuthenticated from '../../utils/clientauth.js';
import isauthenticated from '../../utils/authmiddlewware.js';
// Configure multer for in-memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

// ✅ Route to submit feedback with an image
router.post('/user/feedback', isAuthenticated, upload.single('image'), async (req, res) => {
    try {
        // ✅ Ensure body fields are properly extracted
        const { Vendor_id, feedback, rating } = req.body;
        const { user_id, name,number } = req.user;

        // ✅ Ensure feedback and rating exist
        if (!Vendor_id || !feedback || !rating) {
            return res.status(400).json({ message: "Vendor_id, feedback, and rating are required!" });
        }

        // ✅ Ensure rating is a number
        const numericRating = Number(rating);
        if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
            return res.status(400).json({ message: "Rating must be a number between 1 and 5" });
        }

        // ✅ Process image if provided
        const imageBase64 = req.file ? req.file.buffer.toString("base64") : null;

        // ✅ Store feedback in the database
        const newFeedback = await Feedback.create({ 
            Vendor_id, 
            feedback, 
            rating: numericRating, 
            user_id, 
            name, 
            number  ,
            image: imageBase64 
        });

        res.status(201).json({ message: "Feedback submitted successfully", feedback: newFeedback });
    } catch (error) {
        res.status(500).json({ message: "Error in submitting feedback", error: error.message });
    }
});

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