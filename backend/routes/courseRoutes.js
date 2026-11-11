const express = require("express");
const auth = require("../middleware/auth");
const learnerAuth = require("../middleware/learnerAuth");
const {
  selectCourse,
  getMyCourses,
  getMyCourse,
  cancelCourse,
} = require("../controllers/courseController");
const { getProgress, updateProgress } = require("../controllers/progressController");

const router = express.Router();

router.use(auth, learnerAuth);
router.post("/", selectCourse);
router.get("/", getMyCourses);
router.get("/progress", getProgress);
router.put("/progress/:topicId", updateProgress);
router.get("/:id", getMyCourse);
router.delete("/:id", cancelCourse);

module.exports = router;