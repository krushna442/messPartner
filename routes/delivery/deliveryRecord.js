import express from 'express';
import DeliveryRecord from '../../models/DeliveryList.js';
import MealRecord from '../../models/mealrecord.js';
import isauthenticated from '../../utils/authmiddlewware.js';
const router = express.Router();




// Generate delivery records for today's meals
router.post('/generate-delivery-records', isauthenticated, async (req, res) => {
    try {
        // Get vendor ID from authenticated user
        const vendorId = req.Vendor.Vendor_id;

        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];

        // Find today's meal record for this vendor
        const mealRecord = await MealRecord.findOne({
            Vendor_id: vendorId,
            date: today
        });

        if (!mealRecord) {
            return res.status(404).json({
                success: false,
                message: 'No meal record found for today'
            });
        }


        // Check if delivery record already exists for today
        const existingDeliveryRecord = await DeliveryRecord.findOne({
            Vendor_id: vendorId,
            date: today
        });

        if (existingDeliveryRecord) {
            return res.status(400).json({
                success: false,
                message: 'Delivery record already exists for today'
            });
        }

        // Prepare delivery groups data structure
        const deliveryGroupsMap = new Map();

        // Process each subscription type in the meal record
        for (const subType of mealRecord.subscriptionTypes) {

            // Process lunch meals
            if (subType.meals.lunch && subType.meals.lunch.length > 0) {
                
                for (const meal of subType.meals.lunch) {
                    const groupName = meal.deliverygroup || 'default';

                    if (!deliveryGroupsMap.has(groupName)) {
                        deliveryGroupsMap.set(groupName, {
                            groupName,
                            agentData: { name: '', number: '' }, // Empty agent data to be filled later
                            meals: {
                                breakfast: [],
                                lunch: [],
                                dinner: []
                            }
                        });
                    }

                    const group = deliveryGroupsMap.get(groupName);
                    group.meals.lunch.push({
                        subscriber: meal,
                        status: "pending"
                    });
                }
            }

            // Process dinner meals
            if (subType.meals.dinner && subType.meals.dinner.length > 0) {
                
                for (const meal of subType.meals.dinner) {
                    const groupName = meal.deliverygroup || 'default';

                    if (!deliveryGroupsMap.has(groupName)) {
                        deliveryGroupsMap.set(groupName, {
                            groupName,
                            agentData: { name: '', number: '' }, // Empty agent data to be filled later
                            meals: {
                                breakfast: [],
                                lunch: [],
                                dinner: []
                            }
                        });
                    }

                    const group = deliveryGroupsMap.get(groupName);
                    group.meals.dinner.push({
                        subscriber: meal,
                        status: "pending"
                    });
                }
            }
        }

        // Convert map to array for the deliveryGroup field
        const deliveryGroups = Array.from(deliveryGroupsMap.values());

        // Create new delivery record
        const newDeliveryRecord = new DeliveryRecord({
            Vendor_id: vendorId,
            date: today,
            deliveryGroup: deliveryGroups
        });

        // Save the delivery record
        const savedRecord = await newDeliveryRecord.save();

        return res.status(201).json({
            success: true,
            message: 'Delivery record generated successfully',
            data: savedRecord
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

export default router;