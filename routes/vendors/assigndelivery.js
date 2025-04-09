import express from "express";
import Mealrecord from "../../models/mealrecord.js";
import Subscriber from "../../models/subscriber.js";
import DeliveryList from "../../models/DeliveryList.js";
import isauthenticated from "../../utils/authmiddlewware.js";
import Vendor from "../../models/Vendor.js";

const router = express.Router();

router.get("/vendor/deliverylist", isauthenticated, async (req, res) => {
  try {
    const { Vendor_id } = req.Vendor;

    if (!Vendor_id) {
      return res.status(400).json({ message: "Vendor ID is required." });
    }

    const today = new Date().toISOString().split("T")[0];

    // Fetch meal record for today
    const mealdata = await Mealrecord.findOne({ Vendor_id, date: today });
    if (!mealdata) {
      return res.status(404).json({ message: "No meal data found for today." });
    }

    // Determine meal type and extract veg/non-veg users
    const currentHour = new Date().getHours();
    let mealType;
    let vegUserIds = [];
    let nonVegUserIds = [];

    if (currentHour >= 4 && currentHour < 10) {
      mealType = "breakfast";
      vegUserIds = mealdata.breakfast.veg;
      nonVegUserIds = mealdata.breakfast.nonVeg;
    } else if (currentHour >= 10 && currentHour < 18) {
      mealType = "lunch";
      vegUserIds = mealdata.lunch.veg;
      nonVegUserIds = mealdata.lunch.nonVeg;
    } else {
      mealType = "dinner";
      vegUserIds = mealdata.dinner.veg;
      nonVegUserIds = mealdata.dinner.nonVeg;
    }

    if (!vegUserIds.length && !nonVegUserIds.length) {
      return res.status(200).json({ message: `No users found for ${mealType}.` });
    }

    // Fetch subscribers who match veg/non-veg user IDs
    const subscribers = await Subscriber.find({
      user_id: { $in: [...vegUserIds, ...nonVegUserIds] },
      Vendor_id
    }).select("user_id user_name number deliverygroup mealtype");

    if (!subscribers.length) {
      return res.status(404).json({ message: "No subscribers found." });
    }

    // Group by `deliverygroup` and meal preference (veg/non-veg)
    const groupedData = {};

    subscribers.forEach(sub => {
      const mealCategory = vegUserIds.includes(sub.user_id) ? "veg" : "nonVeg";
      if (!groupedData[sub.deliverygroup]) {
        groupedData[sub.deliverygroup] = { veg: [], nonVeg: [] };
      }
      groupedData[sub.deliverygroup][mealCategory].push({
        user_id: sub.user_id,
        user_name: sub.user_name,
        number: sub.number
      });
    });

    const deliveryGroups = Object.keys(groupedData).map(group => ({
      groupName: group,
      veg: groupedData[group].veg,
      nonVeg: groupedData[group].nonVeg
    }));

    const deliveryList = new DeliveryList({
      Vendor_id,
      date: today,
      mealType,
      deliveryGroups
    });

    await deliveryList.save();

    const totalDeliveries = vegUserIds.length + nonVegUserIds.length;

    await Vendor.updateOne(
      { Vendor_id },
      { $inc: { mealToDeliver: -totalDeliveries } }
    );

    res.status(201).json({
      message: "Delivery list grouped and stored successfully.",
      deliveryGroups
    });

  } catch (error) {
    console.error("Error fetching delivery list:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});

export default router;
