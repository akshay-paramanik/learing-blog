require("dotenv").config();

const bcrypt = require("bcryptjs");
const connectDB = require("./config/db");
const { cloudinary, assertCloudinaryConfig } = require("./config/cloudinary");
const User = require("./models/User");
const Course = require("./models/Course");
const CourseCatalog = require("./models/CourseCatalog");

const seedCatalog = [
  {
    course: "JavaScript foundations",
    category: "JavaScript",
    description: "Build a confident base for modern web development.",
    level: "Beginner",
    duration: "3 weeks",
    outcomes: ["Write readable JavaScript", "Work with browser APIs", "Build a small interactive feature"],
    skills: ["JavaScript", "DOM", "APIs"],
    lessons: [
      { title: "The language map", summary: "Understand values, variables, and functions.", content: "Start by naming the pieces of JavaScript: values hold information, variables give that information a name, and functions package behavior you can reuse. Write three small functions that transform a value and explain what each one returns.", minutes: 25 },
      { title: "Think in data", summary: "Use arrays and objects to model a real problem.", content: "Choose a familiar collection, such as your learning plan. Represent it as an array of objects, then use map and filter to answer useful questions. The goal is not syntax memorization; it is turning messy information into a shape your program can work with.", minutes: 35 },
      { title: "A browser that responds", summary: "Connect JavaScript to the DOM and user actions.", content: "Select an element, listen for a click, and update the interface with a meaningful result. Finish by adding a loading or empty state so the experience communicates what is happening.", minutes: 40 },
    ],
    imageSource: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=1200",
  },
  {
    course: "Node.js backend",
    category: "Backend",
    description: "Design practical services with Node, Express, and MongoDB.",
    level: "Intermediate",
    duration: "4 weeks",
    outcomes: ["Design REST endpoints", "Persist data with MongoDB", "Protect routes with authentication"],
    skills: ["Node.js", "Express", "MongoDB"],
    lessons: [
      { title: "What a server does", summary: "Trace a request from browser to database and back.", content: "A backend receives a request, validates it, performs a domain operation, and returns a response. Draw that path for one feature before coding. Clear boundaries make debugging and testing much easier.", minutes: 30 },
      { title: "Model the domain", summary: "Turn a learning workflow into MongoDB documents.", content: "Separate catalog courses from a learner's selections. A catalog describes what can be learned; a selection records who chose it and when. This ownership boundary is the foundation for secure queries.", minutes: 40 },
      { title: "Ship a protected endpoint", summary: "Validate input and enforce authentication.", content: "Build one endpoint that creates a course selection. Reject incomplete input, verify the JWT, and always query by the authenticated user's id. Test both the happy path and a request that tries to access someone else's data.", minutes: 45 },
    ],
    imageSource: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200",
  },
  {
    course: "Product design essentials",
    category: "Design",
    description: "Turn open questions into clear digital experiences.",
    level: "Beginner",
    duration: "2 weeks",
    outcomes: ["Frame a user problem", "Create a focused flow", "Explain design decisions"],
    skills: ["UX research", "Wireframes", "Prototyping"],
    lessons: [
      { title: "Start with the person", summary: "Write a problem statement grounded in real needs.", content: "Describe who is trying to do what, why it matters, and what currently gets in the way. Avoid jumping to features. A precise problem gives every later design decision something to answer.", minutes: 20 },
      { title: "Make the path visible", summary: "Sketch the smallest useful user flow.", content: "Map the moments from intention to outcome. Remove steps that do not help the user decide or act. A good flow is not a maze of screens; it is a clear sequence of choices.", minutes: 30 },
      { title: "Prototype the question", summary: "Use a quick prototype to learn, not decorate.", content: "Prototype the riskiest part of the experience first. Put it in front of one person and ask them to think aloud. Record what they expect, not just what they say they like.", minutes: 35 },
    ],
    imageSource: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=1200",
  },
];

async function uploadCourseImage(course) {
  const upload = await cloudinary.uploader.upload(course.imageSource, {
    folder: "learning-blog/courses",
    public_id: course.course.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    overwrite: true,
    resource_type: "image",
  });

  return { url: upload.secure_url, publicId: upload.public_id };
}

async function seed() {
  assertCloudinaryConfig();
  await connectDB();

  const adminPassword = await bcrypt.hash("Admin123!", 12);
  const learnerPassword = await bcrypt.hash("Learner123!", 12);
  const admin = await User.findOneAndUpdate(
    { email: "admin@learningblog.dev" },
    { name: "Learning Admin", password: adminPassword, admin: true },
    { returnDocument: "after", upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  const learner = await User.findOneAndUpdate(
    { email: "learner@learningblog.dev" },
    { name: "Demo Learner", password: learnerPassword, admin: false },
    { returnDocument: "after", upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  await Course.deleteMany({});
  await CourseCatalog.deleteMany({});

  const catalog = [];
  for (const course of seedCatalog) {
    catalog.push({
      course: course.course,
      category: course.category,
      description: course.description,
      level: course.level,
      duration: course.duration,
      outcomes: course.outcomes,
      skills: course.skills,
      lessons: course.lessons,
      image: await uploadCourseImage(course),
    });
  }

  const createdCatalog = await CourseCatalog.create(catalog);
  await Course.create([
    {
      user: learner._id,
      course: createdCatalog[0].course,
      skills: createdCatalog[0].skills,
      learningDate: new Date("2026-10-05"),
      learningTime: "10:00",
      image: createdCatalog[0].image,
    },
    {
      user: learner._id,
      course: createdCatalog[1].course,
      skills: createdCatalog[1].skills,
      learningDate: new Date("2026-10-12"),
      learningTime: "18:30",
      image: createdCatalog[1].image,
    },
  ]);

  console.log(`Seeded ${createdCatalog.length} catalog courses and 2 learner selections.`);
  console.log("Admin login: admin@learningblog.dev / Admin123!");
  console.log("Learner login: learner@learningblog.dev / Learner123!");
}

seed()
  .catch((error) => {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    const mongoose = require("mongoose");
    await mongoose.connection.close();
  });