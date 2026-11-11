const express = require("express");
const auth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");
const { getLearnerProgress } = require("../controllers/progressController");

const router = express.Router();

router.use(auth, adminAuth);
router.get("/users/progress", getLearnerProgress);

module.exports = router;
