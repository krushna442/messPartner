import express from "express";
import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_WHATSAPP_NUMBER;
const client = twilio(accountSid, authToken);

app.post("/send-whatsapp-bulk", async (req, res) => {
    try {
        const { recipients, message } = req.body;

        if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
            return res.status(400).json({ success: false, error: "Recipients array is required." });
        }

        // Use `Promise.allSettled` to ensure all requests are processed
        const results = await Promise.allSettled(
            recipients.map(async (to) => {
                try {
                    const response = await client.messages.create({
                        body: message,
                        from: "whatsapp:+14155238886",
                        to: `whatsapp:${to}`
                    });
                    return { to, sid: response.sid, status: response.status };
                } catch (error) {
                    console.error(`Failed to send message to ${to}:`, error.message);
                    return { to, error: error.message };
                }
            })
        );

        // Separate successful and failed messages
        const success = results.filter(r => r.status === "fulfilled").map(r => r.value);
        const failed = results.filter(r => r.status === "rejected" || r.value?.error);

        res.status(200).json({
            success: success.length > 0,
            message: `Messages processed. Sent: ${success.length}, Failed: ${failed.length}`,
            sentDetails: success,
            failedDetails: failed
        });

    } catch (error) {
        console.error("Error details:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(port, () => console.log(`Server is running on port ${port}`));
