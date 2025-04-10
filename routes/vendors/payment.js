import express from 'express';
import Payment from '../../models/paymentmodel.js';
import multer from 'multer';
import isauthenticated from '../../utils/authmiddlewware.js';


const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

router.post('/create/payment', upload.single("image"), async (req, res) => {
    try {
        const { Vendor_id,user_id, name, phone } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const imageBase64 = req.file.buffer.toString("base64");

        const payment = new Payment({
            image: imageBase64,
            user_id,
            Vendor_id,
            name,
            phone
        });

        const savedPayment = await payment.save();

        return res.status(201).json({
            message: "Payment data saved successfully",
            data: savedPayment
        });
    } catch (error) {
        console.error("Error saving payment:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});
router.get('/payment/history', isauthenticated, async (req, res) => {
    try {
        const { Vendor_id } = req.Vendor;

        const paymentData = await Payment.find({ Vendor_id });

        if (paymentData.length === 0) {
            return res.status(404).json({ message: "No payment data found" });
        }

        return res.status(200).json({
            message: "Payment history retrieved successfully",
            data: paymentData
        });
    } catch (error) {
        console.error("Error fetching payment history:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
});


export default router;
