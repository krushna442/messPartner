import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import cors from "cors";
const router = express.Router();

router.use(cookieParser());

const uri ="mongodb+srv://krushnch442:Krushna72@cluster0.d1dmm.mongodb.net/krushna?retryWrites=true&w=majority";

router.use(express.json());
router.use(express.urlencoded({ extended: true }));
router.use(cors());

mongoose
  .connect(uri)
  .then(() => {
    console.log("Connected to database");
  })
  .catch((err) => {
    console.log(err);
  });

// Middleware to check authentication
const isAuthenticated = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, "krushna");
    req.user = decoded;
    console.log(decoded);
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid token" });
  }
};

// Protected route
router.post("/", isAuthenticated, (req, res) => {
  res.status(200).json({ message: "This is the home page" });
});

// Define the schema correctly (Fix type issue)
const clientSchema = new mongoose.Schema({
  user_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  number: { type: String, required: true, unique: true },
  password: { type: String, required: true, unique: true },
  address: { type: String, required: true },
  meal: { type: String, default: "yes" },
});

const Client = mongoose.model("Client", clientSchema);

// Register User  
router.post("/register", async (req, res) => {
  try {
    const { name, email, number, password,address } = req.body;

    const lastClient = await Client.findOne({}, { user_id: 1 }).sort({ user_id: -1 });

    let newUserId;
    if (lastClient && lastClient.user_id) {
      const lastNum = parseInt(lastClient.user_id.replace("RARSI-c-", ""), 10);
      newUserId = `RARSI-c-${lastNum + 1}`;
    } else {
      newUserId = "RARSI-c-1";
    }

    const newClient = new Client({
      user_id: newUserId,
      name,
      email,
      number,
      password,
      address,
    });

    await newClient.save();
    res.status(201).json({ message: "User created", user_id: newUserId });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Login User
router.post("/login", async (req, res) => {
  try {
    console.log(req.body); 
    const { email, password } = req.body;
    const userdata = await Client.findOne({ email:email});
    console.log(userdata);
    console.log(userdata);

    if (!userdata) {
      return res.status(401).json({ message: "Unauthorized: Invalid email" });
    }
    if (userdata.password !== password) {
      return res.status(401).json({ message: "Unauthorized: Invalid password" });
    }

    const token = jwt.sign({ _id: userdata._id }, "krushna");

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.status(200).json({ message: "Successfully logged in" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Logout User
router.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logged out successfully" });
});

// Meal Off Option
router.post("/mealOff", async (req, res) => {
  try {
    const { email } = req.body;

    const updatedClient = await Client.findOneAndUpdate(
      { email },
      { $set: { meal: "no" } },
      { new: true }
    );

    if (!updatedClient) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "Meal option updated", user: updatedClient });
  } catch (error) {
    res.status(500).json({ error: "Error updating meal option", details: error.message });
  }
});

// Start Server
export default router;
