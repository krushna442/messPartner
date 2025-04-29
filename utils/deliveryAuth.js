import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const isDeliveryAuthenticated = (req, res, next) => {
  const token = req.cookies.deliveryToken;
  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWTSECREAT);
    req.deliveryboy = decoded;  // attaching decoded token info to req
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid token" });
  }
};

export default isDeliveryAuthenticated;
