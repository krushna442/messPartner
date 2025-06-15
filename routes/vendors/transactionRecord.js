import Transaction from '../../models/transaction.js';
import MOnthlySummary from '../../models/monthlySummary.js';
import express from 'express';
import isauthenticated from '../../utils/authmiddlewware.js';
const router = express.Router();


router.post("/transaction",isauthenticated, async (req, res) => {
  try {
    const {
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
const {Vendor_id}= req.Vendor;
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

    // Get start of this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Check for existing MonthlySummary for this vendor and month
    let summary = await MOnthlySummary.findOne({
      vendorId: Vendor_id,
      createdAt: { $gte: startOfMonth }
    });

    if (!summary) {
      // Get last month's summary to get its totalEarnings
      const startOfLastMonth = new Date(startOfMonth);
      startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);

      const lastMonthSummary = await MOnthlySummary.findOne({
        vendorId: Vendor_id,
        createdAt: {
          $gte: startOfLastMonth,
          $lt: startOfMonth
        }
      });

      const lastTotalEarnings = lastMonthSummary ? lastMonthSummary.totalEarnings : 0;

      // Create new MonthlySummary
      summary = new MOnthlySummary({
        vendorId: Vendor_id,
        totalIncome: type === 'income' ? amount : 0,
        totalExpenses: type === 'expense' ? amount : 0,
        netProfit: type === 'income' ? amount : -amount,
        totalEarnings: lastTotalEarnings + (type === 'income' ? amount : 0),
        updatedAt: new Date()
      });

    } else {
            const startOfLastMonth = new Date(startOfMonth);
      startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);

      const lastMonthSummary = await MOnthlySummary.findOne({
        vendorId: Vendor_id,
        createdAt: {
          $gte: startOfLastMonth,
          $lt: startOfMonth
        }
      });

      const lastTotalEarnings = lastMonthSummary ? lastMonthSummary.totalEarnings : 0;
      // Update existing summary
      if (type === 'income') {
        summary.totalIncome += amount;
        summary.totalEarnings =lastTotalEarnings+ summary.totalIncome;
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
});


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
router.get("/monthly-summary", isauthenticated, async (req, res) => {
  try {
    const { Vendor_id } = req.Vendor;

    // Start of current month
    const startOfCurrentMonth = new Date();
    startOfCurrentMonth.setDate(1);
    startOfCurrentMonth.setHours(0, 0, 0, 0);

    // Start of previous month
    const startOfPreviousMonth = new Date(startOfCurrentMonth);
    startOfPreviousMonth.setMonth(startOfPreviousMonth.getMonth() - 1);

    // End of previous month (1 millisecond before current month starts)
    const endOfPreviousMonth = new Date(startOfCurrentMonth.getTime() - 1);

    // Fetch current month summary
    const currentMonthSummary = await MOnthlySummary.findOne({
      vendorId: Vendor_id,
      createdAt: { $gte: startOfCurrentMonth }
    });

    // Fetch previous month summary
    const previousMonthSummary = await MOnthlySummary.findOne({
      vendorId: Vendor_id,
      createdAt: { $gte: startOfPreviousMonth, $lte: endOfPreviousMonth }
    });

    res.status(200).json({
      currentMonthSummary,
      previousMonthSummary
    });

  } catch (error) {
    console.error('Error fetching monthly summaries:', error);
    res.status(500).json({ message: 'Server Error', error });
  }
});


export default router;
