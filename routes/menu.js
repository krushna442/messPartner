import express from "express";
import Menu from "../models/menumodel.js";

const router = express.Router();

router.post("/add/menu", async (req, res) => {
  try {
    const { meals, Vendor_id, mealType ,packageType} = req.body;
    // Check if a menu already exists for this vendor, type
    let existingMenu = await Menu.findOne({ Vendor_id, mealType ,packageType});

    // Default empty menu structure
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
      let typelower = type.toLowerCase();
      if (menu[dayLower] && menu[dayLower][typelower] !== undefined) {
        menu[dayLower][typelower] = item;
      }
    });

    if (existingMenu) {
      // Update the existing menu
      existingMenu.menu = menu;
      await existingMenu.save();
      return res.status(200).json({ message: "Weekly menu updated", existingMenu });
    } else {
      // Save new menu with type
      const newMenu = new Menu({ Vendor_id, mealType, menu,packageType });
      await newMenu.save();
      return res.status(201).json({ message: "Weekly menu added", newMenu });
    }
  } catch (error) {
    res.status(500).json({ message: "Error adding/updating weekly menu", error: error.message });
  }
});

// Get menu for a specific vendor, type
router.post("/show/menu", async (req, res) => {
  try {
    const { Vendor_id, mealType, packageType  } = req.body;
    const menu = await Menu.findOne({ Vendor_id: Vendor_id, mealType,packageType});

    if (!menu) {
      return res.status(404).json({ message: "Menu not found for this vendor, " });
    }

    res.status(200).json(menu);
  } catch (error) {
    res.status(500).json({ message: "Error fetching menu", error: error.message });
  }
});

export default router;
