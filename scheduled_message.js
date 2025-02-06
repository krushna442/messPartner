import express from "express";
import bodyParser from "body-parser";
import twilio from "twilio";
import cors from "cors";
import cron from "node-cron";
import { config } from "dotenv";

config();

const app = express();
app.use(bodyParser.json());
app.use(cors());

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

app.post("/sendMessage", (req, res) => {
  const { phone, message } = req.body;

  if (!phone || !message) {
    return res.status(400).json({ message: "Phone number and message are required." });
  }

  res.status(200).json({ message: "Message scheduled successfully! Sending in 1 second..." });

  // Schedule the message 1 second later
//   cron.schedule("0 0 1 * *", () => {
  cron.schedule("* * * * * *", () => {
    client.messages
      .create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone,
      })
      .then(() => console.log(`Message sent to ${phone}`))
      .catch((err) => console.error("Error sending message:", err.message));
  }, { scheduled: true, timezone: "UTC" });

  // To prevent continuous execution, the job should ideally stop after one execution.
  
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
