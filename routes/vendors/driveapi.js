import express from 'express';
import { google } from 'googleapis';
import multer from 'multer';
import dotenv from 'dotenv';
import { Readable } from 'stream';

dotenv.config();

const router = express.Router();
const driveAPI = JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS);
driveAPI.private_key = driveAPI.private_key.replace(/\\n/g, '\n');

const upload = multer({ storage: multer.memoryStorage() });

const auth = new google.auth.GoogleAuth({
  credentials: driveAPI,
  scopes: ['https://www.googleapis.com/auth/drive'],
});

router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded!' });
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Unsupported file type!' });
    }

    if (!driveAPI.folderId) {
      return res.status(500).json({ error: 'Google Drive folder ID not configured.' });
    }

    const drive = google.drive({ version: 'v3', auth });
    const bufferStream = Readable.from(req.file.buffer);

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
    res.json({ success: true, driveId: response.data.id, imageUrl });
  } catch (error) {
    console.error('Google Drive Upload Error:', error);
    res.status(500).json({ error: 'Failed to upload image', details: error.message });
  }
});

router.get('/image/:id', async (req, res) => {
  try {
    const drive = google.drive({ version: 'v3', auth });
    const fileId = req.params.id;

    const metadata = await drive.files.get({ fileId, fields: 'mimeType' });

    const file = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    );

    res.setHeader('Content-Type', metadata.data.mimeType);
    file.data.pipe(res);
  } catch (error) {
    console.error('Fetch Image Error:', error);
    res.status(500).json({ error: 'Failed to fetch image', details: error.message });
  }
});

export default router;
