import express from 'express';
import { google } from 'googleapis';
import multer from 'multer';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Readable } from 'stream';

const router = express.Router();

// Get current directory path (for ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load driveAPI.json synchronously
const driveAPIPath = join(__dirname, '../../driveAPI.json');
const driveAPI = JSON.parse(readFileSync(driveAPIPath, 'utf8'));

// Configure Multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Google Drive Auth Setup (reuse credentials from your JSON)
const auth = new google.auth.GoogleAuth({
  credentials: driveAPI,
  scopes: ['https://www.googleapis.com/auth/drive'],
});

// Upload Endpoint
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded!" });
    }

    const drive = google.drive({ version: 'v3', auth });

    // Convert Buffer to Stream
    const bufferStream = new Readable();
    bufferStream.push(req.file.buffer);
    bufferStream.push(null); // Signals end of stream

    // Upload file to Google Drive folder
    const response = await drive.files.create({
      requestBody: {
        name: `${Date.now()}_${req.file.originalname}`,
        parents: [driveAPI.folderId],
      },
      media: {
        mimeType: req.file.mimetype,
        body: bufferStream,
      },
      fields: 'id,name,webViewLink',
    });

    // Make file publicly viewable
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

// Generate public Google Drive image URL
const imageUrl = `https://drive.google.com/uc?export=view&id=${response.data.id}`;

res.json({
  success: true,
  driveId: response.data.id,
  imageUrl: imageUrl,
});

  } catch (error) {
    console.error("Google Drive Upload Error:", error);
    res.status(500).json({
      error: "Failed to upload image",
      details: error.message,
    });
  }
});



router.get('/image/:id', async (req, res) => {
  try {
    const drive = google.drive({ version: 'v3', auth });
    const fileId = req.params.id;

    const file = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    );

    res.setHeader('Content-Type', 'image/jpeg'); // optionally detect mime type
    file.data.pipe(res);
  } catch (error) {
    console.error('Fetch Image Error:', error);
    res.status(500).json({ error: 'Failed to fetch image' ,error});
  }
});


export default router;
