import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

// Routes
import vendorRoute from './routes/vendor_register.js';
import client_registerRoute from './routes/client_register.js';
import ExcelRoute from './routes/importExcel.js';
import findVendorRoute from './routes/findVendor.js';
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
import feedbackroute from './routes/clients/feedback.js';
import clientmanageRoute from './routes/clientmanagement.js';
import expenseRoute from './routes/vendors/expense.js';
import monthlyreportRoute from './routes/vendors/monthlyreport.js';
import assigndeliveryRoute from './routes/vendors/assigndelivery.js';
import paymentRoute from './routes/vendors/payment.js';
import todaymenuRoute from './routes/clients/todayMenu.js';
import wishlistROute from './routes/clients/wishlist.js';
import settingRoute from './routes/clients/settings.js'

// Notification Routes
import userNotificationRoute from './routes/notifications/user.js';
import vendorNotificationRoute from './routes/notifications/vendor.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;
const allowedOrigins = [
  "http://localhost:5173",
  "https://vendormp.netlify.app",
  "http://localhost:5174"
];

// CORS Setup
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
mongoose.connect(process.env.URI)
  .then(() => console.log("Connected to database"))
  .catch(err => console.error("Database connection error:", err));

// Create HTTP server & socket.io instance
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Register routes with io (for notifications)
app.use('/api/vendor/notifications', userNotificationRoute(io));
app.use('/api/user/notifications', vendorNotificationRoute(io));

// Register all other routes
app.use('/api/vendor', vendorRoute);
app.use('/api', client_registerRoute);
app.use('/api/email', ExcelRoute);
app.use('/api', findVendorRoute);
app.use('/api/vendor', showAllVendorRoute);
app.use('/api', subscriptionRoute);
app.use('/api', profileUpdateRoute);
app.use('/api', mysubscriptionRoute);
app.use('/api/vendor', myclientsRoute);
app.use('/api/vendor', mealcountRoute);
app.use('/api', menuRoute);
app.use('/api', deliveryRoute);
app.use('/api', historyRoute);
app.use('/api', messageRoute);
app.use('/api', feedbackroute);
app.use('/api', clientmanageRoute);
app.use('/api', expenseRoute);
app.use('/api', monthlyreportRoute);
app.use('/api', assigndeliveryRoute);
app.use('/api', paymentRoute);
app.use('/api', todaymenuRoute);
app.use('/api', wishlistROute);
app.use ('/api',settingRoute);

// Socket.IO Events
io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('register', ({ userType, userId }) => {
    const room = `${userType}_${userId}`;
    socket.join(room);
    console.log(`Socket joined room: ${room}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start the server with WebSocket
server.listen(PORT, () => {
  console.log(`Server running with socket on port ${PORT}`);
});
