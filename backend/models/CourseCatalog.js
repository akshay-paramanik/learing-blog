const mongoose = require("mongoose");

const courseCatalogSchema = new mongoose.Schema(
  {
    course: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    level: {
      type: String,
      required: true,
      trim: true,
    },
    duration: {
      type: String,
      required: true,
      trim: true,
    },
    outcomes: {
      type: [String],
      required: true,
      validate: {
        validator: (outcomes) => outcomes.length > 0,
        message: "At least one learning outcome is required",
      },
    },
    skills: {
      type: [String],
      required: true,
      validate: {
        validator: (skills) => skills.length > 0,
        message: "At least one skill is required",
      },
    },
    lessons: [
      {
        title: { type: String, required: true, trim: true },
        summary: { type: String, required: true, trim: true },
        content: { type: String, required: true, trim: true },
        minutes: { type: Number, required: true, min: 1 },
      },
    ],
    image: {
      url: {
        type: String,
        trim: true,
      },
      publicId: {
        type: String,
        trim: true,
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CourseCatalog", courseCatalogSchema);