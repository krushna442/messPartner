import express from 'express';
import Subscriber from '../../models/subscriber.js';
import isauthenticated from '../../utils/authmiddlewware.js';
import mongoose from 'mongoose';
import Vendor from "../../models/Vendor.js"; // ✅ Correct (matches file name)
import Transaction from "../../models/transaction.js";
import MOnthlySummary from "../../models/monthlySummary.js";
const router = express.Router();

// Get pending subscription requests
router.get('/subscription/requests', isauthenticated, async (req, res) => {
    try {
        const vendorId = req.Vendor.Vendor_id; // Assuming your middleware adds Vendor info
        
        if (!vendorId) {
            return res.status(400).json({ message: "Vendor ID is required" });
        }

        const subscribers = await Subscriber.find({
            'VendorData.Vendor_id': vendorId,
        }).select('-__v -createdAt -updatedAt'); // Exclude unnecessary fields

        res.json({
            success: true,
            count: subscribers.length,
            data: subscribers
        });
    } catch (error) {
        console.error("Error fetching subscription requests:", error);
        res.status(500).json({ 
            success: false,
            message: "Server error",
            error: error.message 
        });
    }
});

// Update subscription status (accept/reject)
router.post('/subscription/:id/status', isauthenticated, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const { id } = req.params;
        const { status, reason } = req.body;
        const vendorId = req.Vendor.Vendor_id;

        // Validate input
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid subscription ID" });
        }

        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({ message: "Invalid status. Must be 'accepted' or 'rejected'" });
        }

        if (status === 'rejected' && !reason) {
            return res.status(400).json({ message: "Reason is required for rejection" });
        }

        // Prepare update object
        const updateData = {
            status,
            processedAt: new Date(),
            processedBy: req.Vendor._id
        };

        // Add rejection reason if status is rejected
        if (status === 'rejected') {
            updateData.rejectionReason = reason;
        }

        // Find and update the subscription
        const subscription = await Subscriber.findOneAndUpdate(
            {
                _id: id,
                'VendorData.Vendor_id': vendorId,
                status: 'pending'
            },
            updateData,
            { 
                new: true,
                session
            }
        );

        if (!subscription) {
            return res.status(404).json({ 
                success: false,
                message: "Subscription not found or already processed" 
            });
        }

        // Business logic for accepted subscriptions only
        if (status === 'accepted') {
            // ... your existing acceptance logic ...
        }

        await session.commitTransaction();
        res.json({
            success: true,
            message: `Subscription ${status} successfully`,
            data: subscription
        });

    } catch (error) {
        await session.abortTransaction();
        console.error("Error updating subscription status:", error);
        res.status(500).json({ 
            success: false,
            message: "Server error",
            error: error.message 
        });
    } finally {
        session.endSession();
    }
});

// Get subscription by ID (for vendor to view details)


export default router;