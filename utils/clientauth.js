import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const isAuthenticated = (req, res, next) => {
  const token = req.cookies.clientToken;
  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWTSECREAT);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid token" });
  }
};

 export default isAuthenticated;