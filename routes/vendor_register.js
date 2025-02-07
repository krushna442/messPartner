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

const vendorSchema = new mongoose.Schema({
  Vendor_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  number: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const Vendor = mongoose.model('Vendor', vendorSchema);

// Register Vendor (No authentication required)
router.post('/register', async (req, res) => {
  try {
    const { Vendor_id, name, email, number, password } = req.body;
    const newVendor = new Vendor({ Vendor_id, name, email, number, password });
    await newVendor.save();
    res.status(201).json({ message: 'Vendor registered successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Error registering vendor', error });
  }
});

export default router;
