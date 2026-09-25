const express = require("express");
const auth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");
const {
  addCourse,
  getCourses,
  updateCourse,
  deleteCourse,
} = require("../controllers/adminCourseController");

const router = express.Router();

router.use(auth, adminAuth);
router.post("/", addCourse);
router.get("/", getCourses);
router.put("/:id", updateCourse);
router.delete("/:id", deleteCourse);

module.exports = router;