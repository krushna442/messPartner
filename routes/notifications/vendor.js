import express from 'express';
import isauthenticated from '../../utils/authmiddlewware.js';
const router = express.Router();

export default (io) => {
  router.post('/send',isauthenticated, (req, res) => {
    const { user_id, message,url } = req.body;
    const {Vendor_id,shopname}= req.Vendor;
    if (!user_id || !message) {
      return res.status(400).json({ error: " message are required" });
    }

    const room = `user_${user_id}`;  // ✅ Add underscore prefix
    io.to(room).emit('pushNotification', { message,Vendor_id,shopname,url });

    console.log(`Notification sent to ${room}:`, message);

    return res.status(200).json({ status: 'success', message: `Notification sent to vendor ${Vendor_id}` });
  });

  return router;
};
