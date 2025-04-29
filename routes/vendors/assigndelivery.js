import express from "express";
import Mealrecord from "../../models/mealrecord.js";
import Subscriber from "../../models/subscriber.js";
import DeliveryList from "../../models/DeliveryList.js";
import isauthenticated from "../../utils/authmiddlewware.js";
import Vendor from "../../models/Vendor.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

const router = express.Router();

router.get("/vendor/deliverylist", isauthenticated, async (req, res) => {
  try {
    const { Vendor_id } = req.Vendor;
    if (!Vendor_id) {
      return res.status(400).json({ message: "Vendor ID is required." });
    }

    const today = dayjs().tz("Asia/Kolkata").format("YYYY-MM-DD");
    const currentHour = dayjs().tz("Asia/Kolkata").hour();

    const mealdata = await Mealrecord.findOne({ Vendor_id, date: today });
    if (!mealdata) {
      return res.status(404).json({ message: "No meal data found for today." });
    }

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

    // ✅ Include address1 and address2 fields here
    const subscribers = await Subscriber.find({
      user_id: { $in: [...vegUserIds, ...nonVegUserIds] },
      Vendor_id,
    });

    if (!subscribers.length) {
      return res.status(404).json({ message: "No subscribers found." });
    }

    const shopname = req.Vendor.shopname;

    const groupedData = {};

    subscribers.forEach((sub) => {
      const mealCategory = (vegUserIds.includes(sub.user_id) && sub.mealtype === "veg") ? "veg" : "nonVeg";
      if (!groupedData[sub.deliverygroup]) {
        groupedData[sub.deliverygroup] = { veg: [], nonVeg: [] };
      }
      groupedData[sub.deliverygroup][mealCategory].push({
        user_id: sub.user_id,
        user_name: sub.user_name,
        number: sub.number,
        address1: sub.address1,
        address2: sub.address2,
      });
    });

    const deliveryGroups = Object.keys(groupedData).map((group) => ({
      groupName: group,
      veg: groupedData[group].veg,
      nonVeg: groupedData[group].nonVeg,
    }));

    // 🔧 Update existing DeliveryList or create new one
    const existingDeliveryList = await DeliveryList.findOneAndUpdate(
      { Vendor_id, date: today, mealType },
      { deliveryGroups },
      { new: true }
    );

    if (!existingDeliveryList) {
      // Create new if not found
      await DeliveryList.create({
        Vendor_id,
        shopname,
        date: today,
        mealType,
        deliveryGroups,
      });
    }

    const totalDeliveries = vegUserIds.length + nonVegUserIds.length;

    await Vendor.updateOne(
      { Vendor_id },
      { $inc: { mealToDeliver: -totalDeliveries } }
    );

    res.status(201).json({
      message: "Delivery list grouped and updated successfully.",
      deliveryGroups,
    });
  } catch (error) {
    console.error("Error fetching delivery list:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});

export default router;
