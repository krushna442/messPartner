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
      const menuDoc = await Menu.findOne({ 
        Vendor_id: subscription.Vendor_id, 
        packageType: new RegExp(`^${subscription.packageType}$`, 'i'), 
        mealType: new RegExp(`^${subscription.mealtype}$`, 'i') // subscriber has `mealtype`, menu has `mealType`
      });

      if (menuDoc && menuDoc.menu[currentDay]) {
        menus.push({
          Vendor_id: subscription.Vendor_id,
          mealType: menuDoc.mealType,
          packageType: menuDoc.packageType,
          menu: {
            [currentDay]: menuDoc.menu[currentDay]
          }
        });
      }
    }

    res.json(menus);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong while fetching the menu' });
  }
});

export default router;
