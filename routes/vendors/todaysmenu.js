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

    const todaysmenu = menus.map((menu) => ({
      packageType: menu.packageType,
      mealType: menu.mealType,
      menu: menu.menu[todayKey]  // this is now correct
    }));

    res.status(200).json(todaysmenu);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
