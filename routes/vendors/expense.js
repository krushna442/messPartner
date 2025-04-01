import express from 'express';
import isauthenticated from '../../utils/authmiddlewware.js';
import Expense from '../../models/expensemodel.js';
import Subscriber from '../../models/subscriber.js';
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

router.get('/vendor/profit', isauthenticated, async (req, res) => {
    try {
        const Vendor_id = req.Vendor.Vendor_id;

        // Get current month and year
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        // **Step 1: Fetch Expenses for the Current Month**
        const expenses = await Expense.find({
            Vendor_id,
            createdAt: {
                $gte: new Date(`${currentYear}-${currentMonth}-01`), // Start of the month
                $lt: new Date(`${currentYear}-${currentMonth + 1}-01`) // Start of next month
            }
        }).select('expenseData -_id');

        // Extract expense amounts and sum them
        const totalExpense = expenses.reduce((sum, exp) => {
            return sum + (exp.expenseData.amount ? Number(exp.expenseData.amount) : 0);
        }, 0);

        // **Step 2: Fetch Subscribers for the Current Month**
        const subscribers = await Subscriber.find({
            Vendor_id,
            createdAt: {
                $gte: new Date(`${currentYear}-${currentMonth}-01`),
                $lt: new Date(`${currentYear}-${currentMonth + 1}-01`)
            }
        }).select('subscriptionType');

        // Calculate total subscription value
        const totalSubscriptionValue = subscribers.reduce((sum, sub) => sum + Number(sub.subscriptionType || 0), 0);

        // **Step 3: Calculate Profit**
        const profit = totalSubscriptionValue * 100 - totalExpense;

        // **Step 4: Respond with Data**
        res.status(200).json({
            message: "Profit data fetched successfully",
            totalExpense,
            totalSubscriptionValue,
            profit
        });

    } catch (error) {
        res.status(500).json({ message: "Error fetching profit data", error: error.message });
    }
});



export default router;