const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/auth");

const makeToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
const Job = require("../models/Job");
const clean = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  jobTitle: u.jobTitle || "",
  location: u.location || "",
  weeklyGoal: u.weeklyGoal || 5,
  createdAt: u.createdAt,
});

router.post("/register", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!name || !email || !password) return res.status(400).json({ error: "Fill in all fields" });
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: "Enter a valid email" });
    if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });

    if (await User.findOne({ email })) return res.status(409).json({ error: "Email already registered" });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hash });
    res.status(201).json({ token: makeToken(user._id), user: clean(user) });
  } catch (e) {
    res.status(500).json({ error: "Could not register" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Wrong email or password" });
    }
    res.json({ token: makeToken(user._id), user: clean(user) });
  } catch (e) {
    res.status(500).json({ error: "Could not log in" });
  }
});

router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(401).json({ error: "User not found" });
  res.json({ user: clean(user) });
});

// Update profile details and weekly goal
router.put("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(401).json({ error: "User not found" });

    if (req.body.name !== undefined) {
      const name = String(req.body.name).trim();
      if (!name) return res.status(400).json({ error: "Name cannot be empty" });
      user.name = name.slice(0, 60);
    }
    if (req.body.jobTitle !== undefined) user.jobTitle = String(req.body.jobTitle).trim().slice(0, 80);
    if (req.body.location !== undefined) user.location = String(req.body.location).trim().slice(0, 80);
    if (req.body.weeklyGoal !== undefined) {
      const goal = Math.round(Number(req.body.weeklyGoal));
      if (!goal || goal < 1 || goal > 100) return res.status(400).json({ error: "Weekly goal must be 1 to 100" });
      user.weeklyGoal = goal;
    }

    await user.save();
    res.json({ user: clean(user) });
  } catch (e) {
    res.status(500).json({ error: "Could not update profile" });
  }
});

// Change password
router.put("/password", auth, async (req, res) => {
  try {
    const current = String(req.body.currentPassword || "");
    const next = String(req.body.newPassword || "");
    if (next.length < 6) return res.status(400).json({ error: "New password must be at least 6 characters" });

    const user = await User.findById(req.userId);
    if (!user) return res.status(401).json({ error: "User not found" });
    if (!(await bcrypt.compare(current, user.password))) {
      return res.status(400).json({ error: "Current password is wrong" });
    }

    user.password = await bcrypt.hash(next, 10);
    await user.save();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Could not change password" });
  }
});

// Delete account and all of its jobs
router.delete("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(401).json({ error: "User not found" });
    if (!(await bcrypt.compare(String(req.body.password || ""), user.password))) {
      return res.status(400).json({ error: "Password is wrong" });
    }
    await Job.deleteMany({ user: user._id });
    await User.deleteOne({ _id: user._id });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Could not delete account" });
  }
});

module.exports = router;
