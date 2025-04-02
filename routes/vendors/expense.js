import express from 'express';
import isauthenticated from '../../utils/authmiddlewware.js';
import Expense from '../../models/expensemodel.js';
import Subscriber from '../../models/subscriber.js';

const router = express.Router();

// ✅ **Add Expense Route**
router.post('/vendor/expense', isauthenticated, async (req, res) => {
    try {
        const { Vendor_id } = req.Vendor;
        const expenseData = req.body;

        if (!expenseData || Object.keys(expenseData).length === 0) {
            return res.status(400).json({ message: "Expense data is required" });
        }

        const newExpense = new Expense({ Vendor_id, expenseData });
        const expense = await newExpense.save();

        res.status(201).json({ message: "Expense Added Successfully", expense });
    } catch (error) {
        res.status(500).json({ message: "Error in adding expense", error: error.message });
    }
});

// ✅ **Calculate Profit Route**
router.get('/vendor/profit', isauthenticated, async (req, res) => {
    try {
        const Vendor_id = req.Vendor.Vendor_id;

        // 🗓️ Get current month and year
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        const startOfMonth = new Date(`${currentYear}-${currentMonth}-01`);
        const startOfNextMonth = new Date(`${currentYear}-${currentMonth + 1}-01`);

        // **📝 Step 1: Fetch Expenses**
        const expenses = await Expense.find({
            Vendor_id,
            $expr: {
                $and: [
                    {
                        $gte: [
                            { $dateFromString: { dateString: "$expenseData.date" } },
                            startOfMonth
                        ]
                    },
                    {
                        $lt: [
                            { $dateFromString: { dateString: "$expenseData.date" } },
                            startOfNextMonth
                        ]
                    }
                ]
            }
        });

        // **📊 Calculate Total Expense**
        const totalExpense = expenses.reduce((sum, exp) => {
            return sum + (exp.expenseData.amount ? Number(exp.expenseData.amount) : 0);
        }, 0);

        // **📝 Step 2: Fetch Subscribers**
        const subscribers = await Subscriber.find({
            Vendor_id,
            createdAt: { $gte: startOfMonth, $lt: startOfNextMonth }
        }).select('subscriptionType');

        // **📊 Calculate Total Subscription Revenue**
        const totalSubscriptionValue = subscribers.reduce((sum, sub) => sum + Number(sub.subscriptionType || 0), 0);

        // **📈 Step 3: Calculate Profit**
        const profit = totalSubscriptionValue * 100 - totalExpense;

        // ✅ **Response**
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
