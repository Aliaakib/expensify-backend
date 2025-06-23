const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User"); // 🔄 No need for `.js` extension in CommonJS

const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  console.log("Incoming register payload:", req.body); // 🔍 Debug line

  const { name, email, phone, password, confirmPassword } = req.body;

  try {
    if (password !== confirmPassword)
      return res.status(400).json({ message: "Passwords do not match" });

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
    });

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("❌ Registration error:", err); // 🐛 Add this for stacktrace
    res.status(500).json({ message: "Server error" });
  }
});


// Login
router.post("/login", async (req, res) => {
  const { identifier, password } = req.body;
  try {
    const user = await User.findOne({
      $or: [{ email: identifier }, { phone: identifier }],
    });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.status(200).json({ token, user: { id: user._id, name: user.name } });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password via email or phone
router.post("/reset-password", async (req, res) => {
  const { identifier, newPassword } = req.body;

  if (!identifier || !newPassword) {
    return res.status(400).json({ error: "All fields are required." });
  }

  const isEmail = /^\S+@\S+\.\S+$/.test(identifier);
  const isPhone = /^\d{10}$/.test(identifier);

  if (!isEmail && !isPhone) {
    return res.status(400).json({ error: "Invalid email or phone number." });
  }

  try {
    const user = await User.findOne(
      isEmail ? { email: identifier } : { phone: identifier }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password reset successfully." });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Server error. Try again later." });
  }
});

module.exports = router;
