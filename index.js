import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import vendorRoute from './routes/vendor_register.js';
import client_registerRoute from './routes/client_register.js';
import ExcelRoute from './routes/importExcel.js';
import findVendorRoute from './routes/findVendor.js';
import dotenv, { config } from 'dotenv';
config();
import cookieParser from "cookie-parser";

const app = express();
const PORT =3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
    cors({
      origin: "http://localhost:5173", // ✅ Set your frontend URL explicitly
      credentials: true, // ✅ Allow cookies
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );
  
  

// MongoDB Connection
const uri = process.env.URI;
mongoose.connect(uri)
.then(() => console.log("Connected to database"))
    .catch(err => console.error("Database connection error:", err));
    
    // API Routes
    app.use('/api/vendor', vendorRoute);
    app.use('/api',client_registerRoute)
    app.use('/api/email',ExcelRoute);
    app.use('/api',findVendorRoute);

  
    
    // Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
