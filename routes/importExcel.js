import express from "express";
import { createTransport } from "nodemailer";
import cors from "cors";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import xlsx from "xlsx";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

router.use(express.urlencoded({ extended: true }));
router.use(express.json({ limit: "50mb" })); // Increase payload limit for large files
router.use(cors());

const transporter = createTransport({
  service: "gmail",
  auth: {
  user: "dncrkohinoor@gmail.com",
    pass: "diyb vghp nqxm rtdt"
  },
});

function sendMail({ subject, email, message }) {
  return new Promise((resolve, reject) => {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: subject,
      text: `Email: ${email}\nMessage: ${message}`,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error(`[${new Date().toISOString()}] Email error:`, err);
        return reject({ email, error: "Error sending email." });
      }
      return resolve({ email, message: `Email sent to ${email}` });
    });
  });
}

router.post("/sendBulkEmail", async (req, res) => {
  const { subject, message, excelFile } = req.body;

  try {
    if (!excelFile) {
      return res.status(400).json({ success: false, error: "No file provided" });
    }

    // Decode Base64 if necessary
    const buffer = Buffer.from(excelFile, "base64");
    const workbook = xlsx.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const emailList = sheetData
      .map((item) => item.Email?.toString().trim())
      .filter((email) => email && email.includes("@"));

    if (emailList.length === 0) {
      return res.status(400).json({ success: false, error: "No valid emails found" });
    }

    const results = await Promise.allSettled(
      emailList.map((email) => sendMail({ subject, email, message }))
    );

    res.json({ success: true, results });
  } catch (error) {
    console.error("Error processing file:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
