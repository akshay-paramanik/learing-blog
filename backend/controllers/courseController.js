const mongoose = require("mongoose");
const Course = require("../models/Course");

function courseResponse(course) {
  return {
    id: course._id,
    course: course.course,
    skills: course.skills,
    learningDate: course.learningDate,
    learningTime: course.learningTime,
    image: course.image,
    createdAt: course.createdAt,
  };
}

async function selectCourse(req, res) {
  try {
    const { course, skills, learningDate, learningTime } = req.body;

    if (
      typeof course !== "string" ||
      !Array.isArray(skills) ||
      skills.length === 0 ||
      !learningDate ||
      typeof learningTime !== "string" ||
      !learningTime.trim()
    ) {
      return res.status(400).json({
        message: "Course, skills, learning date, and learning time are required",
      });
    }

    const normalizedSkills = skills.map((skill) => String(skill).trim()).filter(Boolean);

    if (normalizedSkills.length === 0 || !course.trim()) {
      return res.status(400).json({ message: "Course and at least one skill are required" });
    }

    const parsedDate = new Date(learningDate);

    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: "Learning date must be a valid date" });
    }

    const selectedCourse = await Course.create({
      user: req.user._id,
      course: course.trim(),
      skills: normalizedSkills,
      learningDate: parsedDate,
      learningTime: String(learningTime).trim(),
    });

    return res.status(201).json({ course: courseResponse(selectedCourse) });
  } catch (error) {
    return res.status(500).json({ message: "Unable to select course" });
  }
}

async function getMyCourses(req, res) {
  try {
    const courses = await Course.find({ user: req.user._id }).sort({ learningDate: 1 });
    return res.json({ courses: courses.map(courseResponse) });
  } catch (error) {
    return res.status(500).json({ message: "Unable to get courses" });
  }
}

async function getMyCourse(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ message: "Course selection not found" });
  }

  try {
    const course = await Course.findOne({ _id: req.params.id, user: req.user._id });

    if (!course) {
      return res.status(404).json({ message: "Course selection not found" });
    }

    return res.json({ course: courseResponse(course) });
  } catch (error) {
    return res.status(500).json({ message: "Unable to get course details" });
  }
}

async function cancelCourse(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ message: "Course selection not found" });
  }

  try {
    const course = await Course.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!course) {
      return res.status(404).json({ message: "Course selection not found" });
    }

    return res.json({ message: "Course cancelled successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Unable to cancel course" });
  }
}

module.exports = { selectCourse, getMyCourses, getMyCourse, cancelCourse };