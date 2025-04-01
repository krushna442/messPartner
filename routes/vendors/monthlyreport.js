import express from 'express';
import Mealrecord from '../../models/mealrecord.js';
import isauthenticated from '../../utils/authmiddlewware.js';

const router = express.Router();

router.get('/vendor/monthlyrecord',isauthenticated, async (req, res) => {
    try {
        const Vendor_id= req.Vendor.Vendor_id;
        const date = new Date();
        const year = date.getFullYear();
        const month = date.getMonth(); // 0-based index (0 = Jan, 1 = Feb, etc.)

        // Get the first and last date of the current month
        const startOfMonth = new Date(year, month, 1);
        const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999); // End of the last day

        const monthlyRecord = await Mealrecord.find({
            date: { $gte: startOfMonth, $lte: endOfMonth },
            Vendor_id:Vendor_id
        });

        res.json(monthlyRecord);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
