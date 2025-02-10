import express from "express";
import { createTransport } from "nodemailer";
import cors from "cors";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import fileUpload from "express-fileupload";
import xlsx from "xlsx";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

router.use(express.urlencoded({ extended: true }));
router.use(express.json());
router.use(cors());

const uploadDir = "./uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

router.use(
  fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    useTempFiles: true,
    tempFileDir: "./temp/",
  })
);

const transporter = createTransport({
  service: "gmail",
  auth: {
 user: "krushnch442@gmail.com",
    pass: "vdgu pbsu qwjw fivl"
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
  const { subject, message } = req.body;

  try {
    if (!req.files || !req.files.excel) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    const excelFile = req.files.excel;
    const filePath = `${uploadDir}/${excelFile.name}`;

    await excelFile.mv(filePath);

    const workbook = xlsx.readFile(filePath);
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

    // Delete file after processing
    fs.unlink(filePath, (err) => {
      if (err) console.error("Failed to delete file:", err);
      else console.log(`Deleted file: ${filePath}`);
    });

    res.json({ success: true, results });
  } catch (error) {
    console.error("Error processing file:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;