const mongoose = require("mongoose");

const studyProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    topic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseCatalog",
      required: true,
    },
    completedLessons: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
    },
  },
  { timestamps: true }
);

studyProgressSchema.index({ user: 1, topic: 1 }, { unique: true });

module.exports = mongoose.model("StudyProgress", studyProgressSchema);
