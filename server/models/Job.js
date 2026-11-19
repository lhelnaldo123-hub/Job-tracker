const mongoose = require("mongoose");

const STATUSES = ["saved", "applied", "interview", "offer", "rejected"];

const jobSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    company: { type: String, required: true, trim: true, maxlength: 120 },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    link: { type: String, trim: true, default: "" },
    location: { type: String, trim: true, default: "" },
    salary: { type: String, trim: true, default: "" },
    source: { type: String, trim: true, default: "" },
    status: { type: String, enum: STATUSES, default: "saved" },
    appliedDate: { type: Date },
    followUpDate: { type: Date },
    notes: { type: String, default: "", maxlength: 3000 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);
module.exports.STATUSES = STATUSES;
