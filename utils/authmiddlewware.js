// authMiddleware.js

import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
const isauthenticated = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: "login first" });
  }

  try {
    const decoded = jwt.verify(token,process.env.JWTSECREAT);
    req.Vendor = decoded; // You can store the decoded vendor information here
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid token" });
  }
};

export default isauthenticated;