import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import vendorRoute from './routes/vendor_register.js';
import client_registerRoute from './routes/client_register.js';
import ExcelRoute from './routes/importExcel.js';
import findVendorRoute from './routes/findVendor.js';
import dotenv, { config } from 'dotenv';
import showAllVendorRoute from './routes/showAllVendor.js';
import subscriptionRoute from './routes/subscription.js';
import profileUpdateRoute from './routes/profileUpdate.js';
import mysubscriptionRoute from './routes/clients/mysubscriptions.js';
import myclientsRoute from './routes/myclients.js';
import mealcountRoute from './routes/mealcount.js';
import menuRoute from './routes/menu.js';
import deliveryRoute from './routes/delivery/deliveryportal.js';
import historyRoute from './routes/vendors/history.js';
import messageRoute from './routes/vendors/message.js';
import feedbackroute from './routes/clients/feedback.js'
import clientmanageRoute from  './routes/clientmanagement.js'
config();
import cookieParser from "cookie-parser";

import { Callback } from '@tensorflow/tfjs';

const app = express();
const PORT =3000;


const allowedOrigins = ["http://localhost:5173","https://vendormp.netlify.app","http://localhost:5174"];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, 
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

  
// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


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
    app.use ('/api/vendor',showAllVendorRoute);
     app.use('/api',subscriptionRoute);
     app.use('/api',profileUpdateRoute);
     app.use('/api',mysubscriptionRoute);
    app.use ('/api/vendor',myclientsRoute);
    app.use('/api/vendor',mealcountRoute);
    app.use('/api',menuRoute);
    app.use('/api', deliveryRoute);
    app.use('/api',historyRoute);
    app.use ('/api',messageRoute);
    app.use('/api',feedbackroute);
    app.use('/api',clientmanageRoute)

    
    // Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
