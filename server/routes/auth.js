const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/auth");

const makeToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
const clean = (u) => ({ id: u._id, name: u.name, email: u.email });

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

module.exports = router;
