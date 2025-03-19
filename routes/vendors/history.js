import express from "express";
import Mealrecord from "../../models/mealrecord.js";
import Subscriber from "../../models/subscriber.js";

const router = express.Router();

router.post("/meal/history", async (req, res) => {
  const { startDate, endDate, Vendor_id, user_id } = req.body;

  try {
    if (user_id) {
      const records = await Mealrecord.find(
        {
          date: { $gte: new Date(startDate), $lte: new Date(endDate) }, // Date filter added
          $or: [{ breakfast: user_id }, { lunch: user_id }, { dinner: user_id }],
        },
        { date: 1, breakfast: 1, lunch: 1, dinner: 1, _id: 0 }
      );

      // Process results to only include meals where the user is present
      const filteredRecords = records.map((record) => {
        let mealData = { date: record.date };

        if (record.breakfast.includes(user_id)) mealData.type  = "breakfast";
        if (record.lunch.includes(user_id)) mealData.type = "lunch";
        if (record.dinner.includes(user_id)) mealData.type = "dinner";

        return mealData;
      });

      return res.json(filteredRecords);
    } else {
      const mealHistory = await Subscriber.find({
        Vendor_id: Vendor_id,
        updatedAt: { $gte: new Date(startDate), $lte: new Date(endDate) }, // Fixed field name
      },);

      if (mealHistory.length === 0) {
        return res.status(404).json({ message: "No meal history found" });
      }

      return res.json(mealHistory);
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
});

export default router; 
