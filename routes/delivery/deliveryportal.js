import express from "express";
import jwt from "jsonwebtoken";
import Subscriber from "../../models/subscriber.js";
import Deliveryboy from "../../models/deliveryboy.js";
import Mealrecord from "../../models/mealrecord.js";
import isauthenticated from "../../utils/authmiddlewware.js";
import Client from "../../models/Client.js";
import dotenv from "dotenv";
import DeliveryList from "../../models/DeliveryList.js";
import Vendor from "../../models/Vendor.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);
dotenv.config();

const router = express.Router();

router.post('/delivery/login', async (req, res) => {
    try {
        const { phone, Vendor_id } = req.body;
        const deliveryboy = await Deliveryboy.findOne({ phone, Vendor_id });

        if (!deliveryboy) {
            return res.status(400).json({ message: "Invalid phone number or vendor ID" });
        }

        const token = jwt.sign(
            { _id: deliveryboy._id, Vendor_id: deliveryboy.Vendor_id },
            process.env.JWTSECREAT
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "None",
            path: "/",
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });

        res.json({ message: "Login successful",deliveryboy});
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});

router.post('/delivery/register', async (req, res) => {
    try {
        const { name, phone, Vendor_id } = req.body;
        await Deliveryboy.create({ name, phone, Vendor_id });

        res.status(201).json({ message: "Delivery boy registered successfully" });
    } catch (error) {
        res.status(400).json({ message: "Error registering delivery boy", error: error.message });
    }
});




router.post("/today/delivery", async (req, res) => {
  try {
    const { Vendor_id, deliverygroup } = req.body;

    if (!Vendor_id) {
      return res.status(400).json({ message: "Vendor_id is required." });
    }

    const today = dayjs().tz("Asia/Kolkata").format("YYYY-MM-DD");
    const currentHour = dayjs().tz("Asia/Kolkata").hour();

    let mealType = "";
    if (currentHour >= 4 && currentHour < 10) {
      mealType = "breakfast";
    } else if (currentHour >= 10 && currentHour < 18) {
      mealType = "lunch";
    } else {
      mealType = "dinner";
    }

    // Fetch delivery list for this vendor, date, and mealType
    const deliverylist = await DeliveryList.find({
      Vendor_id,
      date: today,
      mealType,
    });

    // Fetch vendor info
    const vendor = await Vendor.findOne({ Vendor_id });

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found." });
    }

    res.status(200).json({
      message: "Delivery list fetched successfully.",
      mealType,
      vendorMealType: vendor.mealtype, // vendor's mealType field
      deliverylist,
    });
  } catch (error) {
    console.error("Error fetching today's delivery list:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});





export default router;
