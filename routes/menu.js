import express from "express";
import Menu from "../models/menumodel.js";

const router = express.Router();

// Add or update menu
router.post("/add/menu", async (req, res) => {
  try {
    const { meals, Vendor_id, mealType, packageType } = req.body;

    // Build update object dynamically
    const updateFields = {};
    meals.forEach(({ day, type, item }) => {
      const path = `menu.${day.toLowerCase()}.${type.toLowerCase()}`;
      updateFields[path] = item;
    });

    const updated = await Menu.findOneAndUpdate(
      { Vendor_id, mealType, packageType },
      { $set: updateFields },
      { new: true, upsert: true }
    );

    return res.status(200).json({ message: "Weekly menu updated", menu: updated });
  } catch (error) {
    console.error("API ERROR:", error);
    res.status(500).json({ message: "Error adding/updating weekly menu", error: error.message });
  }
});




// Fetch menu
router.post("/show/menu", async (req, res) => {
  try {
    const { Vendor_id, mealType, packageType } = req.body;

    const menu = await Menu.findOne({ Vendor_id, mealType, packageType });

    if (!menu) {
      return res.status(404).json({ message: "Menu not found for this vendor" });
    }

    res.status(200).json(menu);
  } catch (error) {
    res.status(500).json({ message: "Error fetching menu", error: error.message });
  }
});

export default router;
