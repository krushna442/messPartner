import express from 'express';
import Menu from '../../models/menumodel.js';
import isauthenticated from '../../utils/authmiddlewware.js';

const router = express.Router();

router.get('/vendor/todaymenu', isauthenticated, async (req, res) => {
  try {
    const { Vendor_id } = req.Vendor;
    const menus = await Menu.find({ Vendor_id });

    const dayMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayKey = dayMap[new Date().getDay()];

    // Use a map to group menus by packageType
    const menuMap = new Map();

    menus.forEach((menu) => {
      const pkg = menu.packageType;
      if (!menuMap.has(pkg)) {
        menuMap.set(pkg, {
          packageType: pkg,
          veg: {},
          nonveg: {}
        });
      }

      const todayMenu = menu.menu[todayKey] || {};

      if (menu.mealType === 'veg') {
        menuMap.get(pkg).veg = todayMenu;
      } else if (menu.mealType === 'nonveg') {
        menuMap.get(pkg).nonveg = todayMenu;
      }
    });

    const todaysmenu = Array.from(menuMap.values());

    res.status(200).json(todaysmenu);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
