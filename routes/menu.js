import express from "express";
import Menu from "../models/menumodel.js";

const router = express.Router();

router.post("/add/menu", async (req, res) => {
  try {
    const { week, meals, Vendor_id } = req.body;

    if (!Vendor_id) {
      return res.status(400).json({ message: "Vendor_id is required" });
    }

    // Check if a menu already exists for this vendor and week
    let existingMenu = await Menu.findOne({ week, Vendor_id });

    // If a menu exists, use its menu object; otherwise, create a new structure
    let menu = existingMenu
      ? existingMenu.menu
      : {
          monday: { breakfast: "", lunch: "", dinner: "" },
          tuesday: { breakfast: "", lunch: "", dinner: "" },
          wednesday: { breakfast: "", lunch: "", dinner: "" },
          thursday: { breakfast: "", lunch: "", dinner: "" },
          friday: { breakfast: "", lunch: "", dinner: "" },
          saturday: { breakfast: "", lunch: "", dinner: "" },
          sunday: { breakfast: "", lunch: "", dinner: "" },
        };

    // Populate menu based on received data
    meals.forEach(({ day, type, item }) => {
      let dayLower = day.toLowerCase();
      let typeLower = type.toLowerCase();
      if (menu[dayLower] && menu[dayLower][typeLower] !== undefined) {
        menu[dayLower][typeLower] = item;
      }
    });

    if (existingMenu) {
      // Update the existing menu
      existingMenu.menu = menu;
      await existingMenu.save();
      return res.status(200).json({ message: "Weekly menu updated", existingMenu });
    } else {
      // Save new menu
      const newMenu = new Menu({ Vendor_id, week, menu });
      await newMenu.save();
      return res.status(201).json({ message: "Weekly menu added", newMenu });
    }
  } catch (error) {
    res.status(500).json({ message: "Error adding/updating weekly menu", error });
  }
});

// Get menu for a specific vendor and week
router.get("/menu/:vendorId/:week", async (req, res) => {
  try {
    const { vendorId, week } = req.params;
    const menu = await Menu.findOne({ Vendor_id: vendorId, week });

    if (!menu) {
      return res.status(404).json({ message: "Menu not found for this vendor and week" });
    }

    res.status(200).json(menu);
  } catch (error) {
    res.status(500).json({ message: "Error fetching menu", error });
  }
});

export default router;
