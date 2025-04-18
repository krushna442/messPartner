import express from 'express';
import Vendor from '../../models/Vendor.js';
import Client from '../../models/Client.js';
import isAuthenticated from '../../utils/clientauth.js';

const router = express.Router();

// ✅ Add to Wishlist
router.post('/add/wishlist', isAuthenticated, async (req, res) => {
  try {
    const { user_id } = req.user;
    const { Vendor_id } = req.body;

    const response = await Client.findOneAndUpdate(
      { user_id },
      { $addToSet: { wishlist: Vendor_id } }, // prevents duplicates
      { new: true }
    );

    if (!response) return res.status(404).json({ message: "Client not found" });

    res.status(200).json({ message: "Vendor added to wishlist", wishlist: response.wishlist });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});


// ✅ Show Wishlist
router.get('/wishlist', isAuthenticated, async (req, res) => {
  try {
    const { user_id } = req.user;

    const client = await Client.findOne({ user_id }).populate('wishlist');

    if (!client) return res.status(404).json({ message: "Client not found" });

    res.status(200).json({ wishlist: client.wishlist });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});


// ✅ Remove from Wishlist
router.post('/remove/wishlist', isAuthenticated, async (req, res) => {
  try {
    const { user_id } = req.user;
    const { Vendor_id } = req.body;

    const response = await Client.findOneAndUpdate(
      { user_id },
      { $pull: { wishlist: Vendor_id } },
      { new: true }
    );

    if (!response) return res.status(404).json({ message: "Client not found" });

    res.status(200).json({ message: "Vendor removed from wishlist", wishlist: response.wishlist });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

export default router ;
