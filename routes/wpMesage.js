import express, { Router, json } from 'express';
import { create } from 'axios';
import { config } from 'dotenv';
const router = Router();

// Load environment variables
config();

// WAPOST API configuration
const WAPOST_CONFIG = {
    baseURL: 'https://wapost.net/api/v1',
    apiKey: process.env.WAPOST_API_KEY,
    instanceId: process.env.WAPOST_INSTANCE_ID
};

// Axios instance with default config
const wapostClient = create({
    baseURL: WAPOST_CONFIG.baseURL,
    headers: {
        'Authorization': `Bearer ${WAPOST_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
    }
});

// Middleware to validate WAPOST configuration
const validateConfig = (req, res, next) => {
    if (!WAPOST_CONFIG.apiKey || !WAPOST_CONFIG.instanceId) {
        return res.status(500).json({
            success: false,
            message: 'WAPOST API configuration is missing'
        });
    }
    next();
};

// Send a single text message
router.post('/send-message', validateConfig, async (req, res) => {
    try {
        const { phoneNumber, message } = req.body;

        if (!phoneNumber || !message) {
            return res.status(400).json({
                success: false,
                message: 'Phone number and message are required'
            });
        }

        const response = await wapostClient.post('/send', {
            instance_id: WAPOST_CONFIG.instanceId,
            to: phoneNumber,
            message: message
        });

        res.json({
            success: true,
            data: response.data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
            error: error.response?.data || error
        });
    }
});

// Send an image message with optional caption
router.post('/send-image', validateConfig, async (req, res) => {
    try {
        const { phoneNumber, imageUrl, caption } = req.body;

        if (!phoneNumber || !imageUrl) {
            return res.status(400).json({
                success: false,
                message: 'Phone number and image URL are required'
            });
        }

        const response = await wapostClient.post('/send-media', {
            instance_id: WAPOST_CONFIG.instanceId,
            to: phoneNumber,
            media_url: imageUrl,
            caption: caption || ''
        });

        res.json({
            success: true,
            data: response.data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
            error: error.response?.data || error
        });
    }
});

// Send bulk messages
router.post('/send-bulk', validateConfig, async (req, res) => {
    try {
        const { messages } = req.body;

        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Messages array is required and cannot be empty'
            });
        }

        const results = [];
        const errors = [];

        // Process messages sequentially with delay
        for (const msg of messages) {
            try {
                let response;
                if (msg.imageUrl) {
                    response = await wapostClient.post('/send-media', {
                        instance_id: WAPOST_CONFIG.instanceId,
                        to: msg.phoneNumber,
                        media_url: msg.imageUrl,
                        caption: msg.caption || msg.message || ''
                    });
                } else {
                    response = await wapostClient.post('/send', {
                        instance_id: WAPOST_CONFIG.instanceId,
                        to: msg.phoneNumber,
                        message: msg.message
                    });
                }
                results.push({
                    phoneNumber: msg.phoneNumber,
                    status: 'success',
                    data: response.data
                });

                // Add delay between messages (1 second)
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                errors.push({
                    phoneNumber: msg.phoneNumber,
                    error: error.message,
                    details: error.response?.data
                });
            }
        }

        res.json({
            success: true,
            results,
            errors,
            summary: {
                total: messages.length,
                successful: results.length,
                failed: errors.length
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
            error: error.response?.data || error
        });
    }
});

// Check message status
router.get('/message-status/:messageId', validateConfig, async (req, res) => {
    try {
        const { messageId } = req.params;

        const response = await wapostClient.get('/message-status', {
            params: {
                instance_id: WAPOST_CONFIG.instanceId,
                message_id: messageId
            }
        });

        res.json({
            success: true,
            data: response.data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
            error: error.response?.data || error
        });
    }
});

// Express app setup
const app = express();
app.use(json());
app.use('/api/whatsapp', router);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: err.message
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

export default router;