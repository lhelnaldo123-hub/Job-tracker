const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    jobTitle: { type: String, trim: true, default: "", maxlength: 80 },
    location: { type: String, trim: true, default: "", maxlength: 80 },
    weeklyGoal: { type: Number, default: 5, min: 1, max: 100 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
