import asyncHandler from "express-async-handler";
import admin from "../config/firebaseAdmin.js";
import User from "../models/userModel.js";

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decodedToken = await admin.auth().verifyIdToken(token);
      const { uid, email, name, picture } = decodedToken;

      // Find or create user in local DB
      let user = await User.findOne({ email: email });

      if (!user) {
        user = await User.create({
          name: name || email.split('@')[0],
          email: email,
          photoURL: picture || '',
          password: `firebase-auth|${uid}` // Placeholder password
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error("Error in protect middleware:", error);
      res.status(401);
      throw new Error("Not authorized, token failed");
    }
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }
});

export { protect };
