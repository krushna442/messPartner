import mongoose from "mongoose";
import express from "express";
import isAuthenticated from "../../utils/clientauth.js";
import Subscriber from "../../models/subscriber.js";

const router = express.Router();

// Define the Message Schema
const messageSchema = new mongoose.Schema({
    subject: String,
    meal: String,
    Vendor_id: String,
    date: { type: Date, required: true }, // The date when the message is valid
    createdAt: { type: Date, default: Date.now } // Timestamp of creation
});

// Create the Message Model
const Message = mongoose.model("Message", messageSchema);

// Route to add a message
router.post('/vendor/add/message', async (req, res) => {
    try {
        const { subject, meal, Vendor_id, date } = req.body;

        const messageDate = new Date(date);
        messageDate.setHours(23, 59, 59, 999); // Ensure the message is valid until the end of that date

        const message = new Message({ subject, meal, Vendor_id, date: messageDate });

        await message.save();
        res.status(200).json({ message: "Message added successfully" });
    } catch (err) {
        res.status(400).json({ message: "Error in adding message", error: err });
    }
});

// Route to show messages for a user (Only fetch valid messages)
router.get('/show/message', isAuthenticated, async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const vendorIds = await Subscriber.find({ user_id }).select('Vendor_id');

        const now = new Date();

        const messages = await Promise.all(
            vendorIds.map((id) =>
                Message.find({
                    Vendor_id: id.Vendor_id,
                    date: { $gte: now } // Fetch only valid messages
                })
            )
        );

        res.status(200).json({ messages: messages.flat() }); // Flatten the array
    } catch (error) {
        res.status(400).json({ message: "Error in fetching messages", error });
    }
});

// Background Job: Delete expired messages
const deleteExpiredMessages = async () => {
    try {
        const now = new Date();
        await Message.deleteMany({ date: { $lt: now } });
        console.log("✅ Expired messages deleted.");
    } catch (error) {
        console.error("❌ Error deleting expired messages:", error);
    }
};

// Run the cleanup job every hour
setInterval(deleteExpiredMessages, 60 * 60 * 1000); // Runs every hour

export default router;
