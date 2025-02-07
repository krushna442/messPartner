import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router();
router.use(cookieParser());
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

const uri = process.env.MONGO_URI;
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to database'))
  .catch(err => console.error('Database connection error:', err));

const clientSchema = new mongoose.Schema({
  user_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const Client = mongoose.model('Client', clientSchema);

// Register Client (No authentication required)
router.post('/register', async (req, res) => {
  try {
    const { user_id, name, email, password } = req.body;
    const newClient = new Client({ user_id, name, email, password });
    await newClient.save();
    res.status(201).json({ message: 'Client registered successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Error registering client', error });
  }
});

export default router;
