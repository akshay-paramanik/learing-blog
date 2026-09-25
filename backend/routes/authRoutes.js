const express = require("express");
const { register, login, logout, getInfo } = require("../controllers/userController");
const auth = require("../middleware/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", auth, getInfo);

module.exports = router;