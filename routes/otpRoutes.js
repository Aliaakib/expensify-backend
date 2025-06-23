const express = require("express");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");

const router = express.Router();

// Temporary store for OTPs and user data
let otpStore = {}; // email: { otp, userData, expiresAt }

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Helper to generate 6-digit OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP (initial and resend)
router.post("/send-otp", async (req, res) => {
  const { name, email, phone, password } = req.body;

  // For resend, only email is mandatory, for first send, all fields required
  if (!email || (!otpStore[email] && (!name || !phone || !password))) {
    return res.status(400).json({ error: "Required fields missing." });
  }

  try {
    // Use existing userData on resend or create new on first send
    let userData = otpStore[email]?.userData;

    if (!userData) {
      // Hash password once
      const hashedPassword = await bcrypt.hash(password, 10);
      userData = { name, email, phone, password: hashedPassword };
    }

    // Generate new OTP and expiry (e.g., 15 minutes)
    const otp = generateOtp();
    const expiresAt = Date.now() + 15 * 60 * 1000;

    // Save to store
    otpStore[email] = { otp, userData, expiresAt };

    // Prepare email
    const mailOptions = {
      from: `"Expensify" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Email Verification OTP",
      text: `Your OTP is ${otp}. It is valid for 15 minutes.`,
    };

    await transporter.sendMail(mailOptions);

    return res.json({ message: "OTP sent to email." });
  } catch (err) {
    console.error("Send OTP error:", err);
    return res.status(500).json({ error: "Failed to send OTP." });
  }
});

// Verify OTP and register user
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  const record = otpStore[email];

  if (!record) {
    return res.status(400).json({ error: "OTP not found. Please resend." });
  }

  if (Date.now() > record.expiresAt) {
    delete otpStore[email];
    return res.status(400).json({ error: "OTP expired. Please resend." });
  }

  if (record.otp !== otp) {
    return res.status(400).json({ error: "Invalid OTP." });
  }

  // TODO: Replace with your actual DB logic here
  // For example:
  // const existingUser = await UserModel.findOne({ email });
  // if (existingUser) return res.status(400).json({ error: "User already exists." });
  // await UserModel.create(record.userData);

  // Simulate registration
  console.log("✅ User Registered:", record.userData);

  // Clean up
  delete otpStore[email];

  res.json({ success: true, message: "User registered successfully!" });
});

module.exports = router;
