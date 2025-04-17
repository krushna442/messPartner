import express from 'express';
const router = express.Router();
import isAuthenticated from '../../utils/clientauth.js';
import Subscriber from '../../models/subscriber.js';
import Menu from '../../models/menumodel.js';

router.get('/user/menu', isAuthenticated, async (req, res) => {
  try {
    const { user_id } = req.user;
    const subscriptions = await Subscriber.find({ user_id });

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = dayNames[new Date().getDay()];

    const menus = [];

    for (const subscription of subscriptions) {
      const query = {
        Vendor_id: new RegExp(`^${subscription.Vendor_id}$`, 'i'),
        packageType: new RegExp(`^${subscription.packageType}$`, 'i'),
        mealType: new RegExp(`^${subscription.mealtype}$`, 'i')
      };

      const menuDoc = await Menu.findOne(query);

      if (menuDoc && menuDoc.menu[currentDay]) {
        menus.push({
          Vendor_id: subscription.Vendor_id,
          mealType: menuDoc.mealType,
          packageType: menuDoc.packageType,
          menu: {
            [currentDay]: menuDoc.menu[currentDay]
          }
        });
      } else {
        console.log(`No menu found or no menu for day: ${currentDay}`);
      }
    }

    res.json(menus);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong while fetching the menu' });
  }
});

router.get('/user/fullmenu', isAuthenticated, async (req, res) => {
  try {
    const { user_id } = req.user;
    const subscriptions = await Subscriber.find({ user_id });

    const fullMenus = [];

    for (const subscription of subscriptions) {
      const query = {
        Vendor_id: new RegExp(`^${subscription.Vendor_id}$`, 'i'),
        packageType: new RegExp(`^${subscription.packageType}$`, 'i'),
        mealType: new RegExp(`^${subscription.mealtype}$`, 'i')
      };

      const menuDoc = await Menu.findOne(query);

      if (menuDoc && menuDoc.menu) {
        fullMenus.push({
          Vendor_id: subscription.Vendor_id,
          mealType: menuDoc.mealType,
          packageType: menuDoc.packageType,
          menu: menuDoc.menu // full weekly menu
        });
      } else {
        console.log(`No full menu found for Vendor_id: ${subscription.Vendor_id}`);
      }
    }

    res.json(fullMenus);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong while fetching the full menu' });
  }
});


export default router;
