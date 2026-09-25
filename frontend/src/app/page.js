"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const starterCourses = [
  {
    id: "javascript",
    course: "JavaScript foundations",
    description: "Build a confident base for modern web development.",
    skills: ["JavaScript", "DOM", "APIs"],
    color: "sun",
  },
  {
    id: "node",
    course: "Node.js backend",
    description: "Design practical services with Node, Express, and MongoDB.",
    skills: ["Node.js", "Express", "MongoDB"],
    color: "mint",
  },
  {
    id: "ux",
    course: "Product design essentials",
    description: "Turn open questions into clear digital experiences.",
    skills: ["UX research", "Wireframes", "Prototyping"],
    color: "coral",
  },
];

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Something went wrong");
  return data;
}

export default function Home({
  initialView = "home",
  initialAuthMode = "login",
}) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [view, setView] = useState(initialView);
  const [authMode, setAuthMode] = useState(initialAuthMode);
  const [auth, setAuth] = useState({ name: "", email: "", password: "" });
  const [selected, setSelected] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(0);
  const [myCourses, setMyCourses] = useState([]);
  const [catalogCourses, setCatalogCourses] = useState([]);
  const [adminCourses, setAdminCourses] = useState([]);
  const [adminForm, setAdminForm] = useState({
    course: "",
    description: "",
    level: "Beginner",
    duration: "Self-paced",
    outcomes: "",
    skills: "",
    lessons: "",
  });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    request("/catalog")
      .then(({ courses }) => setCatalogCourses(courses))
      .catch(() => {});
  }, []);
  useEffect(() => {
    request("/auth/me")
      .then(({ user: current }) => setUser(current))
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (!user) return;
    request("/courses")
      .then(({ courses }) => setMyCourses(courses))
      .catch(() => {});
    if (user.admin)
      request("/admin/courses")
        .then(({ courses }) => setAdminCourses(courses))
        .catch(() => {});
  }, [user]);

  const notify = (text) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 3500);
  };
  const openAuth = (mode) => {
    setAuthMode(mode);
    setView("auth");
    router.push(mode === "login" ? "/login" : "/register");
  };
  const catalog = catalogCourses.length ? catalogCourses : starterCourses;

  async function submitAuth(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const path = authMode === "login" ? "/auth/login" : "/auth/register";
      const { user: current } = await request(path, {
        method: "POST",
        body: JSON.stringify(auth),
      });
      setUser(current);
      setView("home");
      setAuth({ name: "", email: "", password: "" });
      notify("Your learning space is ready.");
    } catch (error) {
      notify(error.message);
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    await request("/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
    setMyCourses([]);
    setView("home");
    router.push("/");
    notify("You have been logged out.");
  }
  function choose(course) {
    if (!user) {
      openAuth("login");
      notify("Log in to choose a course.");
      return;
    }
    setSelected(course);
    setSelectedLesson(0);
    setView("course");
  }
  async function selectCourse(event) {
    event.preventDefault();
    setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      const { course } = await request("/courses", {
        method: "POST",
        body: JSON.stringify({
          course: selected.course,
          skills: selected.skills,
          learningDate: form.get("date"),
          learningTime: form.get("time"),
        }),
      });
      setMyCourses([...myCourses, course]);
      setView("my-courses");
      notify("Course added to your learning plan.");
    } catch (error) {
      notify(error.message);
    } finally {
      setBusy(false);
    }
  }
  async function cancelCourse(id) {
    try {
      await request(`/courses/${id}`, { method: "DELETE" });
      setMyCourses(myCourses.filter((course) => course.id !== id));
      notify("Course cancelled.");
    } catch (error) {
      notify(error.message);
    }
  }
  async function addCourse(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const { course } = await request("/admin/courses", {
        method: "POST",
        body: JSON.stringify({
          ...adminForm,
          outcomes: adminForm.outcomes.split(","),
          skills: adminForm.skills.split(","),
          lessons: adminForm.lessons
            .split("\n")
            .map((line) => line.split("|").map((part) => part.trim()))
            .filter((lesson) => lesson.length >= 4 && lesson[0])
            .map(([title, summary, content, minutes]) => ({
              title,
              summary,
              content,
              minutes: Number(minutes) || 15,
            })),
        }),
      });
      setAdminCourses([course, ...adminCourses]);
      setAdminForm({
        course: "",
        description: "",
        level: "Beginner",
        duration: "Self-paced",
        outcomes: "",
        skills: "",
        lessons: "",
      });
      notify("Course published.");
    } catch (error) {
      notify(error.message);
    } finally {
      setBusy(false);
    }
  }
  async function deleteCourse(id) {
    try {
      await request(`/admin/courses/${id}`, { method: "DELETE" });
      setAdminCourses(adminCourses.filter((course) => course.id !== id));
      notify("Course removed from the catalog.");
    } catch (error) {
      notify(error.message);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => router.push("/")}>
          <span className="brand-mark">lb</span> learning/blog
        </button>
        <nav className="nav-links">
          <button
            className={view === "home" ? "active" : ""}
            onClick={() => {
              setView("home");
              router.push("/");
            }}
          >
            Explore
          </button>
          {user && (
            <button
              className={view === "my-courses" ? "active" : ""}
              onClick={() => {
                setView("my-courses");
                router.push("/learning");
              }}
            >
              My learning
            </button>
          )}
          {user?.admin && (
            <button
              className={view === "admin" ? "active" : ""}
              onClick={() => {
                setView("admin");
                router.push("/admin");
              }}
            >
              Admin desk
            </button>
          )}
        </nav>
        <div className="top-actions">
          {user ? (
            <>
              <button
                className="avatar"
                onClick={() => {
                  setView("profile");
                  router.push("/profile");
                }}
                aria-label="Open profile"
              >
                {user.name.charAt(0).toUpperCase()}
              </button>
              <button className="quiet-button" onClick={logout}>
                Log out
              </button>
            </>
          ) : (
            <button
              className="outline-button"
              onClick={() => openAuth("login")}
            >
              Log in
            </button>
          )}
        </div>
      </header>
      {message && (
        <div className="toast" role="status">
          {message}
        </div>
      )}
      {view === "home" && (
        <HomeView
          user={user}
          courses={catalog}
          choose={choose}
          join={() => openAuth("register")}
        />
      )}
      {view === "auth" && (
        <AuthView
          mode={authMode}
          form={auth}
          setMode={setAuthMode}
          onChange={(event) =>
            setAuth({ ...auth, [event.target.name]: event.target.value })
          }
          onSubmit={submitAuth}
          busy={busy}
        />
      )}
      {view === "course" && (
        <CourseView
          course={selected}
          selectedLesson={selectedLesson}
          setSelectedLesson={setSelectedLesson}
          onSubmit={selectCourse}
          onBack={() => {
            setView("home");
            router.push("/");
          }}
          busy={busy}
        />
      )}
      {view === "my-courses" && (
        <MyCourses
          courses={myCourses}
          cancel={cancelCourse}
          explore={() => {
            setView("home");
            router.push("/");
          }}
        />
      )}
      {view === "profile" && user && (
        <Profile user={user} courses={myCourses} />
      )}
      {view === "admin" && user?.admin && (
        <AdminView
          courses={adminCourses}
          form={adminForm}
          setForm={setAdminForm}
          onSubmit={addCourse}
          onDelete={deleteCourse}
          busy={busy}
        />
      )}
    </main>
  );
}

function HomeView({ user, courses, choose, join }) {
  return (
    <div className="page-content">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">A calmer way to grow</p>
          <h1>
            Make room for
            <br />
            <em>what&apos;s next.</em>
          </h1>
          <p className="hero-text">
            Choose a skill, set the pace, and keep your learning plans close.
            Small steps make capable people.
          </p>
          <button
            className="primary-button"
            onClick={
              user
                ? () =>
                    document
                      .getElementById("course-list")
                      .scrollIntoView({ behavior: "smooth" })
                : join
            }
          >
            {user ? "Browse courses" : "Start learning"}
            <span>↗</span>
          </button>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="art-note">
            learn
            <br />
            <strong>in public</strong>
          </div>
          <div className="art-stamp">
            since
            <br />
            <b>2024</b>
          </div>
        </div>
      </section>
      <section className="notice-strip">
        <span className="notice-dot" />
        <p>
          <strong>Today&apos;s note</strong> — Your future self will thank you
          for starting before you feel ready.
        </p>
        <span className="notice-date">25 / 09 / 26</span>
      </section>
      <section className="section-heading" id="course-list">
        <div>
          <p className="eyebrow">The library</p>
          <h2>
            Find your next
            <br />
            <em>good challenge.</em>
          </h2>
        </div>
        <span className="course-count">
          {courses.length.toString().padStart(2, "0")} courses
        </span>
      </section>
      <div className="course-grid">
        {courses.map((course, index) => (
          <CourseCard
            key={course.id || course._id || index}
            course={course}
            index={index}
            choose={choose}
          />
        ))}
      </div>
    </div>
  );
}
function CourseCard({ course, index, choose }) {
  return (
    <article
      className={`course-card ${course.color || ["sun", "mint", "coral"][index % 3]}`}
    >
      <div className="course-number">0{index + 1}</div>
      <div className="course-arrow">↗</div>
      <div className="course-card-body">
        <p className="card-label">COURSE</p>
        <h3>{course.course}</h3>
        <p>{course.description}</p>
        <div className="skill-row">
          {course.skills.map((skill) => (
            <span key={skill}>{skill}</span>
          ))}
        </div>
        <button className="card-link" onClick={() => choose(course)}>
          View details <span>→</span>
        </button>
      </div>
    </article>
  );
}
function AuthView({ mode, form, setMode, onChange, onSubmit, busy }) {
  return (
    <div className="auth-page">
      <div className="auth-intro">
        <p className="eyebrow">learning/blog</p>
        <h1>
          Bring your
          <br />
          <em>curiosity.</em>
        </h1>
        <p>A focused place for the skills you want to carry forward.</p>
      </div>
      <form className="auth-form" onSubmit={onSubmit}>
        <div className="form-heading">
          <p className="eyebrow">
            {mode === "login" ? "Welcome back" : "New here?"}
          </p>
          <h2>
            {mode === "login" ? "Sign in to learn." : "Create your space."}
          </h2>
        </div>
        {mode === "register" && (
          <label>
            Name
            <input required name="name" value={form.name} onChange={onChange} />
          </label>
        )}
        <label>
          Email
          <input
            required
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
          />
        </label>
        <label>
          Password
          <input
            required
            minLength="6"
            name="password"
            type="password"
            value={form.password}
            onChange={onChange}
          />
        </label>
        <button className="primary-button wide" disabled={busy}>
          {busy ? "Working..." : mode === "login" ? "Log in" : "Create account"}
          <span>↗</span>
        </button>
        <p className="switch-auth">
          {mode === "login" ? "New to the blog?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
          >
            {mode === "login" ? "Register" : "Log in"}
          </button>
        </p>
      </form>
    </div>
  );
}
function CourseView({
  course,
  selectedLesson,
  setSelectedLesson,
  onSubmit,
  onBack,
  busy,
}) {
  const lessons = course.lessons || [];
  const lesson = lessons[selectedLesson];

  return (
    <div className="detail-page">
      <button className="back-link" onClick={onBack}>
        ← Back to courses
      </button>
      <div className="detail-layout">
        <div className="detail-visual sun">
          <span>COURSE</span>
          <strong>
            Go
            <br />
            <em>deeper.</em>
          </strong>
        </div>
        <div className="detail-copy">
          <p className="eyebrow">Learn by doing</p>
          <h1>{course.course}</h1>
          <p className="detail-description">{course.description}</p>
          <div className="course-meta">
            <span>{course.level || "Guided learning"}</span>
            <span>{course.duration || "Self-paced"}</span>
            <span>{lessons.length} lessons</span>
          </div>
          {course.outcomes?.length > 0 && (
            <div className="outcome-block">
              <p className="eyebrow">By the end, you can</p>
              <ul>
                {course.outcomes.map((outcome) => (
                  <li key={outcome}>{outcome}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="detail-skills">
            <p className="eyebrow">You&apos;ll explore</p>
            <div className="skill-row">
              {course.skills.map((skill) => (
                <span key={skill}>{skill}</span>
              ))}
            </div>
          </div>
          {lesson && (
            <div className="lesson-reader">
              <div className="lesson-reader-heading">
                <div>
                  <p className="eyebrow">
                    Lesson {selectedLesson + 1} · {lesson.minutes} min
                  </p>
                  <h2>{lesson.title}</h2>
                </div>
                <span>Read, try, reflect</span>
              </div>
              <p className="lesson-summary">{lesson.summary}</p>
              <p className="lesson-content">{lesson.content}</p>
            </div>
          )}
          {lessons.length > 0 && (
            <div className="lesson-list">
              <p className="eyebrow">Your roadmap</p>
              {lessons.map((item, index) => (
                <button
                  className={
                    index === selectedLesson
                      ? "lesson-item active"
                      : "lesson-item"
                  }
                  key={item.title}
                  onClick={() => setSelectedLesson(index)}
                >
                  <span className="lesson-index">0{index + 1}</span>
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.summary}</small>
                  </span>
                  <span className="lesson-minutes">{item.minutes} min</span>
                </button>
              ))}
            </div>
          )}
          <div className="enrollment-callout">
            <div>
              <p className="eyebrow">Make it real</p>
              <strong>Choose a time to practice.</strong>
            </div>
            <form className="schedule-form" onSubmit={onSubmit}>
              <div>
                <label>
                  Learning date
                  <input required name="date" type="date" />
                </label>
                <label>
                  Preferred time
                  <input required name="time" type="time" />
                </label>
              </div>
              <button className="primary-button" disabled={busy}>
                {busy ? "Adding..." : "Add to my learning"}
                <span>↗</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
function MyCourses({ courses, cancel, explore }) {
  return (
    <div className="page-content narrow-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Your plan</p>
          <h1>
            My <em>learning.</em>
          </h1>
        </div>
        <button className="outline-button" onClick={explore}>
          + Add course
        </button>
      </div>
      {courses.length === 0 ? (
        <div className="empty-state">
          <span>✦</span>
          <h2>Your plan is open.</h2>
          <p>
            Choose a course and give your next skill a place on the calendar.
          </p>
          <button className="primary-button" onClick={explore}>
            Explore courses <span>↗</span>
          </button>
        </div>
      ) : (
        <div className="plan-list">
          {courses.map((course) => (
            <article className="plan-item" key={course.id}>
              <div className="plan-date">
                <strong>{new Date(course.learningDate).getDate()}</strong>
                <span>
                  {new Intl.DateTimeFormat("en-US", { month: "short" }).format(
                    new Date(course.learningDate),
                  )}
                </span>
              </div>
              <div className="plan-copy">
                <p className="eyebrow">{course.learningTime}</p>
                <h3>{course.course}</h3>
                <div className="skill-row">
                  {course.skills.map((skill) => (
                    <span key={skill}>{skill}</span>
                  ))}
                </div>
              </div>
              <button className="danger-link" onClick={() => cancel(course.id)}>
                Cancel
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
function Profile({ user, courses }) {
  return (
    <div className="page-content narrow-page">
      <div className="profile-header">
        <div className="profile-avatar">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="eyebrow">Your profile</p>
          <h1>{user.name}</h1>
          <p>{user.email}</p>
        </div>
      </div>
      <div className="stats-row">
        <div>
          <strong>{courses.length}</strong>
          <span>planned courses</span>
        </div>
        <div>
          <strong>{user.admin ? "Admin" : "Learner"}</strong>
          <span>account type</span>
        </div>
        <div>
          <strong>2026</strong>
          <span>member since</span>
        </div>
      </div>
      <div className="profile-note">
        <p className="eyebrow">A little reminder</p>
        <h2>Consistency beats intensity.</h2>
        <p>Keep showing up for the version of you that is still becoming.</p>
      </div>
    </div>
  );
}
function AdminView({ courses, form, setForm, onSubmit, onDelete, busy }) {
  const set = (key, value) => setForm({ ...form, [key]: value });
  return (
    <div className="page-content admin-page">
      <div className="admin-heading">
        <div>
          <p className="eyebrow">Admin desk</p>
          <h1>
            Keep the library
            <br />
            <em>alive.</em>
          </h1>
        </div>
        <span className="admin-badge">ADMIN ACCESS</span>
      </div>
      <div className="admin-stats">
        <div>
          <span>CATALOG COURSES</span>
          <strong>{courses.length.toString().padStart(2, "0")}</strong>
        </div>
        <div>
          <span>ACTIVE SELECTIONS</span>
          <strong>--</strong>
        </div>
        <div>
          <span>UPCOMING SKILLS</span>
          <strong>
            {new Set(courses.flatMap((course) => course.skills || [])).size
              .toString()
              .padStart(2, "0")}
          </strong>
        </div>
      </div>
      <div className="admin-grid">
        <form className="admin-form" onSubmit={onSubmit}>
          <p className="eyebrow">Publish a course</p>
          <h2>Add to the library.</h2>
          <label>
            Course name
            <input
              required
              value={form.course}
              onChange={(event) => set("course", event.target.value)}
            />
          </label>
          <label>
            Description
            <textarea
              required
              rows="3"
              value={form.description}
              onChange={(event) => set("description", event.target.value)}
            />
          </label>
          <div className="admin-form-row">
            <label>
              Level
              <input
                required
                value={form.level}
                onChange={(event) => set("level", event.target.value)}
              />
            </label>
            <label>
              Duration
              <input
                required
                value={form.duration}
                onChange={(event) => set("duration", event.target.value)}
              />
            </label>
          </div>
          <label>
            Outcomes <span className="field-hint">comma separated</span>
            <input
              required
              value={form.outcomes}
              onChange={(event) => set("outcomes", event.target.value)}
            />
          </label>
          <label>
            Skills <span className="field-hint">comma separated</span>
            <input
              required
              value={form.skills}
              onChange={(event) => set("skills", event.target.value)}
            />
          </label>
          <label>
            Lessons{" "}
            <span className="field-hint">
              one per line: title | summary | content | minutes
            </span>
            <textarea
              required
              rows="5"
              value={form.lessons}
              onChange={(event) => set("lessons", event.target.value)}
            />
          </label>
          <button className="primary-button wide" disabled={busy}>
            {busy ? "Publishing..." : "Publish course"}
            <span>↗</span>
          </button>
        </form>
        <div className="admin-list">
          <p className="eyebrow">Current library</p>
          <div>
            {courses.map((course) => (
              <article className="admin-course" key={course.id}>
                <div>
                  <h3>{course.course}</h3>
                  <p>{course.skills.join(" · ")}</p>
                </div>
                <button
                  className="danger-link"
                  onClick={() => onDelete(course.id)}
                >
                  Delete
                </button>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
