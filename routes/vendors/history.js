import express from "express";
import Mealrecord from "../../models/mealrecord.js";
import Subscriber from "../../models/subscriber.js";
const router = express.Router();

router.post("/meal/history", async (req, res) => {
  const {  Vendor_id, user_id } = req.body;

  try {
    if (user_id) {
      const records = await Mealrecord.find(
        {
          $or: [{ breakfast: user_id }, { lunch: user_id }, { dinner: user_id }],
        },
        { date: 1, breakfast: 1, lunch: 1, dinner: 1, _id: 0 }
      );
      
      // Process results to only include meals where the user is present
      const filteredRecords = records.map((record) => {
        let mealData = { date: record.date, type: [] };
      
        if (record.breakfast.includes(user_id)) mealData.type.push("breakfast");
        if (record.lunch.includes(user_id)) mealData.type.push("lunch");
        if (record.dinner.includes(user_id)) mealData.type.push("dinner");
      
        return mealData;
      });
      
      return res.json(filteredRecords.length > 0 ? filteredRecords : { message: "No meal records found." });

    } else {
      const mealHistory = await Subscriber.find({
        Vendor_id: Vendor_id,
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
