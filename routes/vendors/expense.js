import express from 'express';
import isauthenticated from '../../utils/authmiddlewware.js';
import Expense from '../../models/expensemodel.js';
import Subscriber from '../../models/subscriber.js';
import Payment from '../../models/paymentmodel.js';
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

// ✅ **Calculate Profit Route



router.get('/vendor/profit', isauthenticated, async (req, res) => {
  try {
    const Vendor_id = req.Vendor.Vendor_id;

    // 🗓️ Get current month and year
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const startOfMonth = new Date(`${currentYear}-${currentMonth}-01`);
    const startOfNextMonth = new Date(`${currentYear}-${currentMonth + 1}-01`);

    // 📊 Fetch Expenses for current month
    const expenses = await Expense.find({
      Vendor_id,
$expr: {
  $and: [
    { $gte: [ "$expenseData.date", startOfMonth ] },
    { $lt:  [ "$expenseData.date", startOfNextMonth ] }
  ]
}

    });

    // 📉 Calculate total expenses
    const totalExpense = expenses.reduce((sum, exp) => {
      const amount = Number(exp.expenseData.amount) || 0;
      return sum + amount;
    }, 0);

    // 💸 Fetch Payments for current month
    const payments = await Payment.find({
      Vendor_id,
      createdAt: { $gte: startOfMonth, $lt: startOfNextMonth }
    }).select('amount');

    // 📈 Calculate total payments
    const totalPayment = payments.reduce((sum, pay) => {
      return sum + (Number(pay.amount) || 0);
    }, 0);

    // 📊 Calculate profit
    const profit = totalPayment - totalExpense;

    // ✅ Send response
    res.status(200).json({
      message: "Profit data fetched successfully",
      totalExpense,
      totalPayment,
      profit
    });

  } catch (error) {
    console.error("Profit fetch error:", error);
    res.status(500).json({ message: "Error fetching profit data", error: error.message });
  }
});





export default router;
