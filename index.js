import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import vendorRoute from './routes/vendor_register.js';
import client_registerRoute from './routes/client_register.js';



const app = express();
const PORT =3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// MongoDB Connection
const uri = "mongodb+srv://krushnch442:Krushna72@cluster0.d1dmm.mongodb.net/krushna?retryWrites=true&w=majority";
mongoose.connect(uri)
.then(() => console.log("Connected to database"))
    .catch(err => console.error("Database connection error:", err));
    
    // API Routes
    app.use('/api', vendorRoute);
    app.use('/api',client_registerRoute)
  
    
    // Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
