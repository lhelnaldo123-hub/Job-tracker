const router = require("express").Router();
const mongoose = require("mongoose");
const Job = require("../models/Job");
const auth = require("../middleware/auth");

router.use(auth);

const FIELDS = ["company", "title", "link", "location", "salary", "source", "status", "appliedDate", "followUpDate", "notes"];

function pick(body) {
  const out = {};
  for (const f of FIELDS) {
    if (body[f] !== undefined) out[f] = body[f] === "" && f.endsWith("Date") ? null : body[f];
  }
  return out;
}

// List my jobs (optional ?status=applied)
router.get("/", async (req, res) => {
  const filter = { user: req.userId };
  if (req.query.status) filter.status = req.query.status;
  const jobs = await Job.find(filter).sort({ updatedAt: -1 });
  res.json({ jobs });
});

// Counts per status for the dashboard
router.get("/stats", async (req, res) => {
  const rows = await Job.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(req.userId) } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const stats = { saved: 0, applied: 0, interview: 0, offer: 0, rejected: 0 };
  rows.forEach((r) => (stats[r._id] = r.count));
  res.json({ stats, total: Object.values(stats).reduce((a, b) => a + b, 0) });
});

// Add a job
router.post("/", async (req, res) => {
  try {
    const data = pick(req.body);
    if (!data.company || !data.title) return res.status(400).json({ error: "Company and job title are required" });
    const job = await Job.create({ ...data, user: req.userId });
    res.status(201).json({ job });
  } catch (e) {
    res.status(400).json({ error: "Could not save job" });
  }
});

// Update a job (edit details or move to another status)
router.put("/:id", async (req, res) => {
  try {
    const job = await Job.findOneAndUpdate({ _id: req.params.id, user: req.userId }, pick(req.body), {
      new: true,
      runValidators: true,
    });
    if (!job) return res.status(404).json({ error: "Job not found" });
    res.json({ job });
  } catch (e) {
    res.status(400).json({ error: "Could not update job" });
  }
});

// Delete a job
router.delete("/:id", async (req, res) => {
  try {
    const job = await Job.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!job) return res.status(404).json({ error: "Job not found" });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: "Could not delete job" });
  }
});

module.exports = router;
