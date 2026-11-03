const mongoose = require("mongoose");
const CourseCatalog = require("../models/CourseCatalog");
const StudyProgress = require("../models/StudyProgress");

function progressResponse(progress) {
  return {
    topicId: String(progress.topic),
    completedLessons: progress.completedLessons.map(String),
  };
}

async function getProgress(req, res) {
  try {
    const progress = await StudyProgress.find({ user: req.user._id });
    return res.json({ progress: progress.map(progressResponse) });
  } catch (error) {
    return res.status(500).json({ message: "Unable to get study progress" });
  }
}

async function updateProgress(req, res) {
  const { topicId } = req.params;
  const { lessonId, completed } = req.body;

  if (!mongoose.isValidObjectId(topicId)) {
    return res.status(404).json({ message: "Topic not found" });
  }

  if (!mongoose.isValidObjectId(lessonId) || typeof completed !== "boolean") {
    return res.status(400).json({ message: "A valid lesson and completion state are required" });
  }

  try {
    const topic = await CourseCatalog.findById(topicId).select("lessons._id");
    if (!topic || !topic.lessons.some((lesson) => lesson._id.equals(lessonId))) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    const operation = completed
      ? { $addToSet: { completedLessons: lessonId } }
      : { $pull: { completedLessons: lessonId } };
    const progress = await StudyProgress.findOneAndUpdate(
      { user: req.user._id, topic: topicId },
      operation,
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    return res.json({ progress: progressResponse(progress) });
  } catch (error) {
    return res.status(500).json({ message: "Unable to update study progress" });
  }
}

module.exports = { getProgress, updateProgress };
