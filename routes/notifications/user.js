import express from 'express';
import isAuthenticated from '../../utils/clientauth.js';


export default function (io) {
  const router = express.Router();

  // Send notification to a specific user
  router.post('/send',isAuthenticated, (req, res) => {
    const {user_id ,name}= req.user;
    const { message, url,Vendor_id} = req.body;

    const room = `vendor_${Vendor_id}`; // ✅ matches what frontend joins
    io.to(room).emit('vendor_notification', { message,url,name,user_id });

    res.status(200).json({ success: true, message: 'Notification sent to user' });
  });

  return router;
}
