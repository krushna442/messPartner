import express from 'express';
import Subscriber from '../../models/subscriber.js';
import isauthenticated from '../../utils/authmiddlewware.js';
import mongoose from 'mongoose';

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
            status: "pending"
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
router.post('/subscription/:id/status', async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const { id } = req.params;
        const { status } = req.body;
        const vendorId = req.Vendor.Vendor_id;

        // Validate input
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid subscription ID" });
        }

        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({ message: "Invalid status. Must be 'accepted' or 'rejected'" });
        }

        // Find and update the subscription
        const subscription = await Subscriber.findOneAndUpdate(
            {
                _id: id,
                'VendorData.Vendor_id': vendorId,
                status: 'pending' // Only allow updates for pending requests
            },
            { 
                status,
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
                message: "Subscription not found or already processed" 
            });
        }

        // Only execute business logic for accepted subscriptions
        if (status === 'accepted') {
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

            let summary = await MonthlySummary.findOne({
                vendorId: vendorId,
                createdAt: { $gte: startOfMonth }
            }).session(session);

            if (!summary) {
                summary = new MonthlySummary({
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