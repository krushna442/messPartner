import express from 'express';
import isauthenticated from '../../utils/authmiddlewware.js';
import Client from '../../models/Client.js';
const router = express.Router();

export default (io) => {
  router.post('/send', isauthenticated, async (req, res) => {
    const { user_id, message, url } = req.body;
    const { Vendor_id, shopname } = req.Vendor;

    if (!user_id || !message) {
      return res.status(400).json({ error: "Message is required" });
    }

    try {
      const updatedClient = await Client.findOneAndUpdate(
        { user_id },
        {
          $push: {
            notifications: {
              message,
              Vendor_id,
              shopname,
              url,
              date: new Date(),
              read: false
            }
          }
        },
        { new: true }  // if you want to get updated doc back (optional)
      );

      if (!updatedClient) {
        return res.status(404).json({ error: "Client not found" });
      }

      console.log("Notification saved to DB");

      const room = `user_${user_id}`;
      io.to(room).emit('pushNotification', { message, Vendor_id, shopname, url });
      console.log(`Notification sent to ${room}:`, message);

      return res.status(200).json({ status: 'success', message: `Notification sent to user ${user_id}` });

    } catch (error) {
      console.error("Error saving client notification:", error);
      return res.status(500).json({ error: "Failed to save notification" });
    }
  });

  return router;
};
