import express from 'express';
import isAuthenticated from '../../utils/clientauth.js';
import Vendor from '../../models/Vendor.js';  // assuming this model exists

export default function (io) {
  const router = express.Router();

  // Send notification to a specific vendor and save in DB
  router.post('/send', isAuthenticated, async (req, res) => {
    const { user_id, name } = req.user;
    const { message, url, Vendor_id } = req.body;

    if (!message || !Vendor_id) {
      return res.status(400).json({ error: "Message and Vendor_id are required" });
    }

    try {
      // Push notification to Vendor notifications array
      const updatedVendor = await Vendor.findOneAndUpdate(
        { Vendor_id },
        {
          $push: {
            notifications: {
              message,
              user_id,
              name,
              url,
              date: new Date(),
              read: false
            }
          }
        },
        { new: true }
      );

      if (!updatedVendor) {
        return res.status(404).json({ error: "Vendor not found" });
      }

      console.log("Notification saved to Vendor DB");

      const room = `vendor_${Vendor_id}`;
      io.to(room).emit('vendor_notification', { message, url, name, user_id });
      console.log(`Notification sent to ${room}:`, message);

      return res.status(200).json({ success: true, message: 'Notification sent to vendor' });

    } catch (error) {
      console.error("Error saving vendor notification:", error);
      return res.status(500).json({ error: "Failed to save notification" });
    }
  });

  return router;
}
