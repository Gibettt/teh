import express from "express";
import jwt from "jsonwebtoken";
import { findUserByCredentials } from "../utils/db.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await findUserByCredentials(email, password);

    if (!user) {
      return res.status(401).json({ message: "Email atau password salah" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      process.env.JWT_SECRET || "super-secret-key",
      { expiresIn: "8h" }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
