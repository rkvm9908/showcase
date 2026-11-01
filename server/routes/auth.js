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

            const link = `${process.env.CLIENT_URL}/reset-password/${token}`;
      await sendEmail(
        admin.email,
        "Reset your admin password",
        `
        <div style="background:#f3f6f9;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                  style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;">
            <tr>
              <td style="padding:32px;">
                <h2 style="margin:0 0 12px;color:#0b2545;font-size:22px;">Reset your password</h2>
                <p style="margin:0 0 24px;color:#444444;font-size:15px;line-height:1.6;">
                  Portfolio admin password reset pannanumnu request vandhirukku.
                  Keezha irukkura button-a click pannunga. Idhu <b>15 nimisham</b> mattum work aagum.
                </p>
                <a href="${link}"
                    style="display:inline-block;background:#0e8c8c;color:#ffffff;text-decoration:none;
                          font-weight:bold;font-size:16px;padding:14px 28px;border-radius:8px;">
                  Reset Password
                </a>
                <p style="margin:28px 0 6px;color:#777777;font-size:13px;">
                  Button work aagala-na, idha browser-la paste pannunga:
                </p>
                <p style="margin:0;word-break:break-all;font-size:12px;">
                  <a href="${link}" style="color:#0e8c8c;">${link}</a>
                </p>
                <hr style="border:none;border-top:1px solid #e5eaef;margin:28px 0 16px;">
                <p style="margin:0;color:#999999;font-size:12px;">
                  Neenga idha request pannala-na, indha mail-a ignore pannidunga. Unga password maaraadhu.
                </p>
              </td>
            </tr>
          </table>
        </div>
        `
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