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


router.get('/subscription/rejected', isauthenticated, async (req, res) => {
    try {
        const vendorId = req.Vendor.Vendor_id;

        const rejectedSubscriptions = await Subscriber.find({
            'VendorData.Vendor_id': vendorId,
            status: 'rejected'
        })
        .sort({ processedAt: -1 }) // Sort by most recent rejections first
        .select('-__v'); // Exclude version key

        res.json({
            success: true,
            count: rejectedSubscriptions.length,
            data: rejectedSubscriptions
        });

    } catch (error) {
        console.error("Error fetching rejected subscriptions:", error);
        res.status(500).json({ 
            success: false,
            message: "Server error",
            error: error.message 
        });
    }
});


router.post('/subscription/:id/restore', isauthenticated, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const { id } = req.params;
        const vendorId = req.Vendor.Vendor_id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid subscription ID" });
        }

        // Find and update the subscription
        const subscription = await Subscriber.findOneAndUpdate(
            {
                _id: id,
                'VendorData.Vendor_id': vendorId,
                status: 'rejected' // Only allow restore for rejected requests
            },
            { 
                $set: { status: 'accepted' },
                $unset: { rejectionReason: 1 }, // Remove the rejection reason
                processedAt: new Date(),
                processedBy: req.Vendor._id
            },
            { 
                new: true,
                session
            }
        );

        if (!subscription) {
            return res.status(404).json({ 
                success: false,
                message: "Rejected subscription not found or already processed" 
            });
        }

        // Execute the same business logic as acceptance
        // 1. Update Vendor's subscription type subscribers count
        await Vendor.findByIdAndUpdate(
            subscription.VendorData._id,
            { 
                $inc: { 
                    "subscriptiontype.$[elem].subscribers": 1 
                }
            },
            { 
                session,
                arrayFilters: [{ "elem._id": subscription.subscriptionType._id }]
            }
        );

        // 2. Create transaction record
        const transaction = await Transaction.create([{
            Vendor_id: vendorId,
            type: 'income',
            amount: subscription.subscriptionType.basePrice,
            category: 'subscription_payment',
            description: `Subscription payment for ${subscription.subscriptionType.planName} plan`,
            status: 'completed',
            paymentMethod: 'upi',
            attachment: subscription.paymentDetails.screenshot,
            date: new Date(),
            recipient: subscription.userData.name
        }], { session });

        // 3. Update monthly summary
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        let summary = await MOnthlySummary.findOne({
            vendorId: vendorId,
            createdAt: { $gte: startOfMonth }
        }).session(session);

        if (!summary) {
            summary = new MOnthlySummary({
                vendorId: vendorId,
                totalIncome: subscription.subscriptionType.basePrice,
                totalExpenses: 0,
                netProfit: subscription.subscriptionType.basePrice,
                totalEarnings: subscription.subscriptionType.basePrice,
                updatedAt: new Date()
            });
        } else {
            summary.totalIncome += subscription.subscriptionType.basePrice;
            summary.netProfit = summary.totalIncome - summary.totalExpenses;
            summary.totalEarnings += subscription.subscriptionType.basePrice;
            summary.updatedAt = new Date();
        }

        await summary.save({ session });

        await session.commitTransaction();

        res.json({
            success: true,
            message: "Subscription restored successfully",
            data: subscription
        });

    } catch (error) {
        await session.abortTransaction();
        console.error("Error restoring subscription:", error);
        res.status(500).json({ 
            success: false,
            message: "Server error",
            error: error.message 
        });
    } finally {
        session.endSession();
    }
});
export default router;