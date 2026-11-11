const mongoose = require("mongoose");
const CourseCatalog = require("../models/CourseCatalog");
const StudyProgress = require("../models/StudyProgress");
const User = require("../models/User");

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

async function getLearnerProgress(req, res) {
  try {
    const users = await User.find({ admin: { $ne: true } })
      .select("name email createdAt")
      .sort({ name: 1 })
      .lean();
    const userIds = users.map((user) => user._id);
    const records = userIds.length
      ? await StudyProgress.find({ user: { $in: userIds } })
          .populate({ path: "topic", select: "course lessons" })
          .lean()
      : [];
    const progressByUser = new Map();

    for (const record of records) {
      if (!record.topic) continue;

      const id = String(record.user);
      const topicLessons = record.topic.lessons || [];
      const lessonIds = new Set(topicLessons.map((lesson) => String(lesson._id)));
      const completedLessons = [...new Set(record.completedLessons.map(String))]
        .filter((lessonId) => lessonIds.has(lessonId)).length;
      const topics = progressByUser.get(id) || [];

      topics.push({
        topicId: String(record.topic._id),
        course: record.topic.course,
        completedLessons,
        totalLessons: topicLessons.length,
      });
      progressByUser.set(id, topics);
    }

    return res.json({
      users: users.map((user) => {
        const topics = progressByUser.get(String(user._id)) || [];
        return {
          id: String(user._id),
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          topics,
          completedLessons: topics.reduce((total, topic) => total + topic.completedLessons, 0),
          totalLessons: topics.reduce((total, topic) => total + topic.totalLessons, 0),
        };
      }),
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to get learner progress" });
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

module.exports = { getProgress, getLearnerProgress, updateProgress };
