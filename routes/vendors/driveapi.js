import express from 'express';
import { google } from 'googleapis';
import multer from 'multer';
import dotenv from 'dotenv';
import { Readable } from 'stream';

dotenv.config();

const router = express.Router();

// Parse credentials from environment variable
const driveAPI = JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS);

// Multer config — memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Google Drive Auth Setup
const auth = new google.auth.GoogleAuth({
  credentials: driveAPI,
  scopes: ['https://www.googleapis.com/auth/drive'],
});

// Upload image to Google Drive
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded!' });
    }

    const drive = google.drive({ version: 'v3', auth });

    const bufferStream = new Readable();
    bufferStream.push(req.file.buffer);
    bufferStream.push(null);

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

    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    const imageUrl = `https://drive.google.com/uc?export=view&id=${response.data.id}`;

    res.json({
      success: true,
      driveId: response.data.id,
      imageUrl,
    });
  } catch (error) {
    console.error('Google Drive Upload Error:', error);
    res.status(500).json({
      error: 'Failed to upload image',
      details: error.message,
    });
  }
});

// Fetch image directly by ID
router.get('/image/:id', async (req, res) => {
  try {
    const drive = google.drive({ version: 'v3', auth });
    const fileId = req.params.id;

    const file = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    );

    // Optionally detect mime type by Drive file metadata if needed
    res.setHeader('Content-Type', 'image/jpeg');
    file.data.pipe(res);
  } catch (error) {
    console.error('Fetch Image Error:', error);
    res.status(500).json({ error: 'Failed to fetch image', details: error.message });
  }
});

export default router;
