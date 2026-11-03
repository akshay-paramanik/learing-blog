const mongoose = require("mongoose");
const CourseCatalog = require("../models/CourseCatalog");

function catalogResponse(course) {
  return {
    id: course._id,
    course: course.course,
    category: course.category || "General",
    description: course.description,
    level: course.level,
    duration: course.duration,
    outcomes: course.outcomes,
    skills: course.skills,
    lessons: course.lessons,
    image: course.image,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
  };
}

function normalizeSkills(skills) {
  if (!Array.isArray(skills)) {
    return [];
  }

  return skills.map((skill) => String(skill).trim()).filter(Boolean);
}

function validateCourseInput(course, description, level, duration, outcomes, skills, lessons, category) {
  const normalizedSkills = normalizeSkills(skills);
  const normalizedOutcomes = normalizeSkills(outcomes);

  if (
    typeof course !== "string" ||
    !course.trim() ||
    typeof description !== "string" ||
    !description.trim() ||
    typeof level !== "string" ||
    !level.trim() ||
    typeof duration !== "string" ||
    !duration.trim() ||
    normalizedOutcomes.length === 0 ||
    normalizedSkills.length === 0
  ) {
    return null;
  }

  return {
    course: course.trim(),
    category: typeof category === "string" && category.trim() ? category.trim() : "General",
    description: description.trim(),
    level: level.trim(),
    duration: duration.trim(),
    outcomes: normalizedOutcomes,
    skills: normalizedSkills,
    lessons: Array.isArray(lessons) ? lessons : [],
  };
}

async function addCourse(req, res) {
  const data = validateCourseInput(
    req.body.course,
    req.body.description,
    req.body.level,
    req.body.duration,
    req.body.outcomes,
    req.body.skills,
    req.body.lessons,
    req.body.category
  );

  if (!data) {
    return res.status(400).json({
      message: "Course, description, level, duration, outcomes, and skills are required",
    });
  }

  try {
    const course = await CourseCatalog.create(data);
    return res.status(201).json({ course: catalogResponse(course) });
  } catch (error) {
    return res.status(500).json({ message: "Unable to add course" });
  }
}

async function getCourses(req, res) {
  try {
    const courses = await CourseCatalog.find().sort({ createdAt: -1 });
    return res.json({ courses: courses.map(catalogResponse) });
  } catch (error) {
    return res.status(500).json({ message: "Unable to get courses" });
  }
}

async function updateCourse(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ message: "Course not found" });
  }

  const data = validateCourseInput(
    req.body.course,
    req.body.description,
    req.body.level,
    req.body.duration,
    req.body.outcomes,
    req.body.skills,
    req.body.lessons,
    req.body.category
  );

  if (!data) {
    return res.status(400).json({
      message: "Course, description, level, duration, outcomes, and skills are required",
    });
  }

  try {
    const course = await CourseCatalog.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    return res.json({ course: catalogResponse(course) });
  } catch (error) {
    return res.status(500).json({ message: "Unable to update course" });
  }
}

async function deleteCourse(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ message: "Course not found" });
  }

  try {
    const course = await CourseCatalog.findByIdAndDelete(req.params.id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    return res.json({ message: "Course deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Unable to delete course" });
  }
}

module.exports = { addCourse, getCourses, updateCourse, deleteCourse };