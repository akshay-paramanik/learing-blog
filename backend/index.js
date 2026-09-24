const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");
const notFound = require("./middleware/notFound");
const healthRoutes = require("./routes/healthRoutes");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api/health", healthRoutes);
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
