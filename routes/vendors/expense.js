import express from 'express';
import isauthenticated from '../../utils/authmiddlewware.js';
import Expense from '../../models/expensemodel.js';
const router = express.Router();

router.post('/vendor/expense',isauthenticated,async(req,res)=>{
    try {
        const{ Vendor_id }= req.Vendor;
        const expenseData = req.body;
        if (!expenseData || Object.keys(expenseData).length === 0) {
            return res.status(400).json({ message: "Expense data is required" });
        }
        const newExpense= new Expense({Vendor_id, expenseData});

        const expense = await newExpense.save();
         res.status(201).json({message:"Expense Added Successfully",expense});
    }catch (error) {
        res.status(500).json({message:"Error in adding expense" ,error: error.message});
        }
});


export default router;