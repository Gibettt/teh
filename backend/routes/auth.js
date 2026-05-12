import express from "express";
import jwt from "jsonwebtoken";
import { readDb } from "../utils/db.js";

const router = express.Router();

router.post("/login", (req, res) => {
  const { email, password } = req.body;
  const db = readDb();

  const user = db.users.find((item) => item.email === email && item.password === password);

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
});

export default router;
