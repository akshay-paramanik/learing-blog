const CourseCatalog = require("../models/CourseCatalog");

async function getCatalog(req, res) {
  try {
    const courses = await CourseCatalog.find().sort({ createdAt: -1 });
    return res.json({ courses });
  } catch (error) {
    return res.status(500).json({ message: "Unable to get course catalog" });
  }
}

module.exports = { getCatalog };