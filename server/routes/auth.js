import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import Admin from "../models/Admin.js";
import auth from "../middleware/auth.js";
import sendEmail from "../utils/sendEmail.js";

const router = Router();
const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many attempts. Try again after 15 minutes." },
});

// Login
router.post("/login", limiter, async (req, res) => {
  try {
    const { email = "", password = "" } = req.body;
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    const ok = admin && (await bcrypt.compare(password, admin.passwordHash));
    if (!ok) return res.status(401).json({ message: "Invalid email or password" });

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Token valid-a nu frontend check panna
router.get("/me", auth, (req, res) => res.json({ ok: true }));

// Forgot password
router.post("/forgot-password", limiter, async (req, res) => {
  try {
    const admin = await Admin.findOne({ email: (req.body.email || "").toLowerCase() });
    if (admin) {
      const token = crypto.randomBytes(32).toString("hex");
      admin.resetTokenHash = sha256(token);
      admin.resetTokenExpires = Date.now() + 15 * 60 * 1000;
      await admin.save();

      const link = `${process.env.CLIENT_URL}/api/reset-password/${token}`;
      await sendEmail(
        admin.email,
        "Reset your admin password",
        `<p>Click the link to reset your password (valid for 15 minutes):</p><p><a href="${link}">${link}</a></p>`
      );
    }
    res.json({ message: "If that email exists, a reset link has been sent." });
  } catch (err) {
    console.error("Forgot password error:", err.message);
    res.status(500).json({ message: "Could not send email" });
  }
});

// Reset password
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { password = "" } = req.body;
    if (password.length < 8)
      return res.status(400).json({ message: "Password must be at least 8 characters" });

    const admin = await Admin.findOne({
      resetTokenHash: sha256(req.params.token),
      resetTokenExpires: { $gt: Date.now() },
    });
    if (!admin) return res.status(400).json({ message: "Link is invalid or expired" });

    admin.passwordHash = await bcrypt.hash(password, 10);
    admin.resetTokenHash = undefined;
    admin.resetTokenExpires = undefined;
    await admin.save();
    res.json({ message: "Password updated. Please log in." });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;