import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import vendorRoute from './routes/vendor_register.js';
import client_registerRoute from './routes/client_register.js';
import ExcelRoute from './routes/importExcel.js';
import dotenv, { config } from 'dotenv';
config();



const app = express();
const PORT =3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// MongoDB Connection
const uri = process.env.URI;
mongoose.connect(uri)
.then(() => console.log("Connected to database"))
    .catch(err => console.error("Database connection error:", err));
    
    // API Routes
    app.use('/api', vendorRoute);
    app.use('/api/vendor',client_registerRoute)
    app.use('/api/email',ExcelRoute)
  
    
    // Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
