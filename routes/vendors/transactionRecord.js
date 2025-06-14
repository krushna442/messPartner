import Transaction from '../../models/transaction.js';
import MOnthlySummary from '../../models/monthlySummary.js';
import express from 'express';
import isauthenticated from '../../utils/authmiddlewware.js';
const router = express.Router();


router.post ("/transaction", async (req, res) => {
  try {
    const {
      Vendor_id,
      type,
      amount,
      category,
      description,
      status,
      paymentMethod,
      attachment,
      date,
      recipient
    } = req.body;

    // Create the transaction
    const transaction = await Transaction.create({
      Vendor_id,
      type,
      amount,
      category,
      description,
      status,
      paymentMethod,
      attachment,
      date,
      recipient
    });

    // Get the month start date
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Check for existing MonthlySummary for this vendor and month
    let summary = await MOnthlySummary.findOne({
      vendorId: Vendor_id,
      createdAt: { $gte: startOfMonth }
    });

    if (!summary) {
      // Create new MonthlySummary
      summary = new MOnthlySummary({
        vendorId: Vendor_id,
        totalIncome: type === 'income' ? amount : 0,
        totalExpenses: type === 'expense' ? amount : 0,
        netProfit: type === 'income' ? amount : -amount,
        updatedAt: new Date()
      });
    } else {
      // Update existing summary
      if (type === 'income') {
        summary.totalIncome += amount;
      } else if (type === 'expense') {
        summary.totalExpenses += amount;
      }
      // Recalculate net profit
      summary.netProfit = summary.totalIncome - summary.totalExpenses;
      summary.updatedAt = new Date();
    }

    // Save MonthlySummary
    await summary.save();

    res.status(201).json({
      message: 'Transaction created and monthly summary updated.',
      transaction,
      monthlySummary: summary
    });

  } catch (error) {
    console.error('Transaction creation error:', error);
    res.status(500).json({ message: 'Server Error', error });
  }
})

router.get("/transactions",isauthenticated, async (req, res) => {
  try {
const{ Vendor_id} = req.Vendor;
    const transactions = await Transaction.find({Vendor_id}).sort({ date: -1 }); // latest first
    res.status(200).json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Server Error', error });
  }
});

export default router;
