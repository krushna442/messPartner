import express from "express";
import Menu from "../models/menumodel.js";

const router = express.Router();

// Add or update menu
router.post("/add/menu", async (req, res) => {
  try {
    const { meals, Vendor_id, mealType, packageType } = req.body;

    // Check if a menu already exists for this vendor, mealType and packageType
    let existingMenu = await Menu.findOne({ Vendor_id, mealType, packageType });

    let menu = existingMenu ? existingMenu.menu : {
      monday: {},
      tuesday: {},
      wednesday: {},
      thursday: {},
      friday: {},
      saturday: {},
      sunday: {},
    };

    // Iterate through meals and update/create values dynamically
    meals.forEach(({ day, type, item }) => {
      const dayLower = day.toLowerCase();
      const typeLower = type.toLowerCase();

      // Ensure day exists
      if (!menu[dayLower]) {
        menu[dayLower] = {};
      }

      // Set or update the meal type
      menu[dayLower][typeLower] = item;
    });

    if (existingMenu) {
      existingMenu.menu = menu;
      await existingMenu.save();
      return res.status(200).json({ message: "Weekly menu updated", existingMenu });
    } else {
      const newMenu = new Menu({ Vendor_id, mealType, packageType, menu });
      await newMenu.save();
      return res.status(201).json({ message: "Weekly menu added", newMenu });
    }
  } catch (error) {
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
