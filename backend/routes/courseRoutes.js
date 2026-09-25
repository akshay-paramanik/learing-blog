const express = require("express");
const auth = require("../middleware/auth");
const {
  selectCourse,
  getMyCourses,
  getMyCourse,
  cancelCourse,
} = require("../controllers/courseController");

const router = express.Router();

router.use(auth);
router.post("/", selectCourse);
router.get("/", getMyCourses);
router.get("/:id", getMyCourse);
router.delete("/:id", cancelCourse);

module.exports = router;