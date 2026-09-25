const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const connectDB = require("./config/db");
const notFound = require("./middleware/notFound");
const healthRoutes = require("./routes/healthRoutes");
const authRoutes = require("./routes/authRoutes");
const courseRoutes = require("./routes/courseRoutes");
const adminCourseRoutes = require("./routes/adminCourseRoutes");
const catalogRoutes = require("./routes/catalogRoutes");

const app = express();
const port = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is missing from the .env file");
}

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/admin/courses", adminCourseRoutes);
app.use("/api/catalog", catalogRoutes);
app.use(notFound);

async function startServer() {
  await connectDB();

  app.listen(port, () => {
    console.log(`Backend server running on http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start backend:", error.message);
  process.exit(1);
});
