"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const progressStorageKey = "learning-blog-progress";
const starterTopics = [
  {
    id: "local-javascript",
    course: "JavaScript fundamentals",
    category: "JavaScript",
    description: "Build a working mental model of the language and use it in the browser.",
    level: "Beginner",
    duration: "3 lessons",
    skills: ["JavaScript", "DOM", "Web"],
    outcomes: ["Use variables and functions", "Work with collections", "Respond to browser events"],
    lessons: [
      {
        id: "local-js-values",
        title: "Values, variables, and types",
        summary: "Give information a useful shape and name.",
        content: "JavaScript programs work with values: strings, numbers, booleans, arrays, objects, and more. A variable gives a value a name so you can use it later.\n\nUse const when a binding should not be reassigned, and let when it needs to change. Prefer clear names such as completedLessons over abbreviations.\n\nTry it: create a const named learner with name and completedLessons properties. Read one property and add a lesson to the array.",
        minutes: 12,
      },
      {
        id: "local-js-functions",
        title: "Functions and decisions",
        summary: "Package behavior and make a program respond to data.",
        content: "A function accepts inputs, performs one focused task, and can return a result. Keeping functions small makes them easier to understand and test.\n\nUse if statements when different inputs should lead to different behavior. For collections, methods such as map, filter, and find express common transformations directly.\n\nTry it: write a function that receives a list of lessons and returns only the ones that are not complete.",
        minutes: 15,
      },
      {
        id: "local-js-dom",
        title: "Make a page interactive",
        summary: "Connect a user action to a meaningful interface update.",
        content: "The DOM is the browser's object model for a page. JavaScript can find elements, listen for events, and update the interface in response.\n\nIn a React app, describe the interface from state instead of editing DOM nodes directly. When a user completes a lesson, update state and let React render the new progress.\n\nTry it: add a button that toggles a lesson between complete and incomplete. Make the label and progress indicator reflect the same state.",
        minutes: 18,
      },
    ],
  },
  {
    id: "local-data-structures",
    course: "Data structures essentials",
    category: "Computer Science",
    description: "Choose practical data structures by understanding the operations they support.",
    level: "Beginner",
    duration: "2 lessons",
    skills: ["Arrays", "Maps", "Complexity"],
    outcomes: ["Compare common collections", "Choose a structure for a task"],
    lessons: [
      {
        id: "local-arrays-maps",
        title: "Arrays, sets, and maps",
        summary: "Compare ordered lists with keyed collections.",
        content: "An array keeps values in order and is a natural fit when position matters or you need to process every item. A set stores unique values and is useful for quick membership checks. A map associates keys with values.\n\nPick a structure by asking what the program needs to do most often: preserve order, avoid duplicates, look up by key, or process a sequence.\n\nTry it: model a set of visited page IDs, then model a lookup from each page ID to its title.",
        minutes: 14,
      },
      {
        id: "local-complexity",
        title: "Reason about runtime",
        summary: "Estimate how work grows as input gets larger.",
        content: "Big O notation describes how an algorithm's work grows with input size. A single pass through n items is O(n); checking every pair is O(n squared). These are growth patterns, not stopwatch timings.\n\nUse the estimate to compare approaches under realistic constraints. A simple linear scan can be the right choice for a small collection; a map can reduce repeated lookups when the collection is large.\n\nTry it: count the loops in a nested search and estimate how many comparisons it makes for 100 items.",
        minutes: 16,
      },
    ],
  },
  {
    id: "local-node-api",
    course: "Build a Node.js API",
    category: "Backend",
    description: "Understand how a request moves through an Express service and reaches data.",
    level: "Intermediate",
    duration: "2 lessons",
    skills: ["Node.js", "Express", "REST"],
    outcomes: ["Trace a request lifecycle", "Validate input", "Return useful API responses"],
    lessons: [
      {
        id: "local-request-flow",
        title: "The request lifecycle",
        summary: "Follow a request through middleware, a route, and a response.",
        content: "An API request passes through middleware, reaches a route handler, performs application work, and returns a status code with data. Middleware is a good place for shared concerns such as parsing JSON or checking authentication.\n\nKeep route handlers focused: validate input, call the domain operation, and choose a clear response. Use 4xx responses for invalid or unauthorized requests and 5xx responses for unexpected server failures.\n\nTry it: sketch the path for creating a topic, including what happens when the title is missing.",
        minutes: 15,
      },
      {
        id: "local-validate-input",
        title: "Validate and persist data",
        summary: "Treat every incoming request as untrusted input.",
        content: "A client can send missing fields, unexpected types, or values that do not belong to the requested resource. Validate shape and ownership before writing to a database.\n\nWhen a user updates their own progress, scope the database query by both the authenticated user ID and the topic ID. This prevents a caller from changing another learner's record.\n\nTry it: list the checks needed before marking a lesson complete: signed-in user, valid topic, lesson belongs to topic, and a boolean completion state.",
        minutes: 17,
      },
    ],
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

function topicId(topic) {
  return String(topic.id || topic._id);
}

function lessonId(lesson) {
  return String(lesson.id || lesson._id);
}

function completionFor(topic, progress) {
  return progress[topicId(topic)] || [];
}

function isDatabaseId(value) {
  return /^[a-f\d]{24}$/i.test(value);
}

export default function LearningPortal({ initialView = "home", initialAuthMode = "login" }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [view, setView] = useState(initialView);
  const [authMode, setAuthMode] = useState(initialAuthMode);
  const [auth, setAuth] = useState({ name: "", email: "", password: "" });
  const [topics, setTopics] = useState(starterTopics);
  const [activeTopicId, setActiveTopicId] = useState(topicId(starterTopics[0]));
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [progress, setProgress] = useState({});
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [selectedCoursesError, setSelectedCoursesError] = useState("");
  const [selectionTopicId, setSelectionTopicId] = useState(null);
  const [savingCourse, setSavingCourse] = useState(false);
  const [cancellingCourseId, setCancellingCourseId] = useState(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All topics");
  const [adminForm, setAdminForm] = useState(emptyTopicForm());
  const [editingTopicId, setEditingTopicId] = useState(null);
  const [adminSection, setAdminSection] = useState("topics");
  const [learnerProgress, setLearnerProgress] = useState([]);
  const [learnerProgressLoading, setLearnerProgressLoading] = useState(true);
  const [learnerProgressError, setLearnerProgressError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const activeTopic = topics.find((topic) => topicId(topic) === activeTopicId) || topics[0];
  const activeLesson = activeTopic?.lessons?.[activeLessonIndex];
  const categories = useMemo(
    () => ["All topics", ...new Set(topics.map((topic) => topic.category || "General"))],
    [topics],
  );
  const filteredTopics = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return topics.filter((topic) => {
      const matchesCategory = category === "All topics" || (topic.category || "General") === category;
      const searchable = [topic.course, topic.description, topic.category, ...(topic.skills || [])]
        .join(" ")
        .toLowerCase();
      return matchesCategory && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [category, query, topics]);
  const lessonTotal = topics.reduce((total, topic) => total + (topic.lessons?.length || 0), 0);
  const completedTotal = Object.values(progress).reduce((total, lessons) => total + lessons.length, 0);

  useEffect(() => {
    let active = true;

    request("/catalog")
      .then(({ courses }) => {
        if (active && courses?.length) {
          setTopics(courses);
          setActiveTopicId(topicId(courses[0]));
        }
      })
      .catch(() => {});

    request("/auth/me")
      .then(({ user: currentUser }) => {
        if (!active) return;
        setUser(currentUser);
        setAuthReady(true);
        if (initialView === "auth") {
          const destination = currentUser.admin ? "admin" : "home";
          setView(destination);
          router.replace(currentUser.admin ? "/admin" : "/");
        } else if (currentUser.admin && initialView !== "admin") {
          setView("admin");
          router.replace("/admin");
        } else if (!currentUser.admin && initialView === "admin") {
          setView("home");
          router.replace("/");
        }
      })
      .catch(() => {
        if (!active) return;
        setUser(null);
        setAuthReady(true);
        if (initialView === "admin") {
          setView("home");
          router.replace("/");
        }
        try {
          const saved = JSON.parse(window.localStorage.getItem(progressStorageKey) || "{}");
          if (saved && typeof saved === "object") setProgress(saved);
        } catch {}
      });

    return () => { active = false; };
  }, [initialView, router]);

  useEffect(() => {
    if (!user) return;
    if (user.admin) {
      request("/admin/courses")
        .then(({ courses }) => setTopics(courses))
        .catch(() => {});
      return;
    }

    request("/courses/progress")
      .then(({ progress: records }) => {
        const saved = Object.fromEntries(records.map((record) => [record.topicId, record.completedLessons]));
        setProgress((current) => ({ ...current, ...saved }));
      })
      .catch(() => {});

    request("/courses")
      .then(({ courses }) => {
        setSelectedCourses(courses);
        setSelectedCoursesError("");
      })
      .catch((error) => setSelectedCoursesError(error.message));
  }, [user]);

  async function selectCourse(topic, selection) {
    if (!user || user.admin) return;
    setSavingCourse(true);
    try {
      const { course } = await request("/courses", {
        method: "POST",
        body: JSON.stringify({
          course: topic.course,
          skills: selection.skills,
          learningDate: selection.learningDate,
          learningTime: selection.learningTime,
        }),
      });
      setSelectedCourses((current) => [...current, course]);
      setSelectionTopicId(null);
      setSelectedCoursesError("");
      notify(`${course.course} added to your learning plan.`);
    } catch (error) {
      notify(error.message);
    } finally {
      setSavingCourse(false);
    }
  }

  async function cancelCourse(course) {
    if (!window.confirm(`Cancel your selection for “${course.course}”?`)) return;
    setCancellingCourseId(String(course.id));
    try {
      await request(`/courses/${course.id}`, { method: "DELETE" });
      setSelectedCourses((current) => current.filter((item) => String(item.id) !== String(course.id)));
      notify(`${course.course} was cancelled.`);
    } catch (error) {
      notify(error.message);
    } finally {
      setCancellingCourseId(null);
    }
  }

  useEffect(() => {
    if (!user?.admin) return;
    let active = true;
    request("/admin/users/progress")
      .then(({ users }) => {
        if (active) setLearnerProgress(users);
      })
      .catch((error) => {
        if (active) setLearnerProgressError(error.message);
      })
      .finally(() => {
        if (active) setLearnerProgressLoading(false);
      });
    return () => { active = false; };
  }, [user]);

  function refreshLearnerProgress() {
    setLearnerProgressLoading(true);
    setLearnerProgressError("");
    request("/admin/users/progress")
      .then(({ users }) => setLearnerProgress(users))
      .catch((error) => setLearnerProgressError(error.message))
      .finally(() => setLearnerProgressLoading(false));
  }

  function notify(text) {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 3500);
  }

  function navigate(nextView, path) {
    setView(nextView);
    if (path) router.push(path);
  }

  function openAuth(mode = "login") {
    setAuthMode(mode);
    setView("auth");
    router.push(mode === "login" ? "/login" : "/register");
  }

  function openTopic(topic) {
    setActiveTopicId(topicId(topic));
    setActiveLessonIndex(0);
    setView("reader");
  }

  function changeLesson(index) {
    setActiveLessonIndex(index);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function toggleLesson(topic, lesson, complete) {
    const id = topicId(topic);
    const selectedLessonId = lessonId(lesson);
    const current = completionFor(topic, progress);
    const next = complete
      ? [...new Set([...current, selectedLessonId])]
      : current.filter((value) => value !== selectedLessonId);
    const nextProgress = { ...progress, [id]: next };
    setProgress(nextProgress);
    window.localStorage.setItem(progressStorageKey, JSON.stringify(nextProgress));

    if (user && isDatabaseId(id) && isDatabaseId(selectedLessonId)) {
      try {
        const { progress: saved } = await request(`/courses/progress/${id}`, {
          method: "PUT",
          body: JSON.stringify({ lessonId: selectedLessonId, completed: complete }),
        });
        setProgress((currentProgress) => ({ ...currentProgress, [saved.topicId]: saved.completedLessons }));
      } catch (error) {
        notify(error.message);
        return;
      }
    }
    notify(complete ? "Lesson marked complete." : "Lesson moved back to in progress.");
  }

  async function submitAuth(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const path = authMode === "login" ? "/auth/login" : "/auth/register";
      const { user: currentUser } = await request(path, {
        method: "POST",
        body: JSON.stringify(auth),
      });
      if (currentUser.admin) {
        setLearnerProgressLoading(true);
        setLearnerProgressError("");
      }
      setUser(currentUser);
      setAuth({ name: "", email: "", password: "" });
      navigate(currentUser.admin ? "admin" : "home", currentUser.admin ? "/admin" : "/");
      notify(currentUser.admin ? "You are signed in as an administrator." : "You are signed in. Your study progress will sync to your account.");
    } catch (error) {
      notify(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await request("/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
    setSelectedCourses([]);
    setSelectedCoursesError("");
    navigate("home", "/");
    notify("You have been logged out.");
  }

  function updateAdminForm(key, value) {
    setAdminForm((current) => ({ ...current, [key]: value }));
  }

  function updateAdminLesson(index, key, value) {
    setAdminForm((current) => ({
      ...current,
      lessons: current.lessons.map((lesson, lessonIndex) =>
        lessonIndex === index ? { ...lesson, [key]: value } : lesson,
      ),
    }));
  }

  function editTopic(topic) {
    setEditingTopicId(topicId(topic));
    setAdminForm({
      course: topic.course || "",
      category: topic.category || "General",
      description: topic.description || "",
      level: topic.level || "Beginner",
      duration: topic.duration || "Self-paced",
      outcomes: (topic.outcomes || []).join(", "),
      skills: (topic.skills || []).join(", "),
      lessons: topic.lessons?.length
        ? topic.lessons.map((lesson) => ({
            title: lesson.title || "",
            summary: lesson.summary || "",
            content: lesson.content || "",
            minutes: lesson.minutes || 10,
          }))
        : [emptyLesson()],
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveTopic(event) {
    event.preventDefault();
    const payload = {
      ...adminForm,
      outcomes: adminForm.outcomes.split(",").map((item) => item.trim()).filter(Boolean),
      skills: adminForm.skills.split(",").map((item) => item.trim()).filter(Boolean),
      lessons: adminForm.lessons
        .filter((lesson) => lesson.title.trim() && lesson.summary.trim() && lesson.content.trim())
        .map((lesson) => ({ ...lesson, minutes: Number(lesson.minutes) || 10 })),
    };
    if (!payload.outcomes.length || !payload.skills.length || !payload.lessons.length) {
      notify("Add at least one outcome, skill, and complete lesson.");
      return;
    }

    setBusy(true);
    try {
      const isEditing = Boolean(editingTopicId);
      const path = isEditing ? `/admin/courses/${editingTopicId}` : "/admin/courses";
      const { course } = await request(path, {
        method: isEditing ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      setTopics((current) => isEditing
        ? current.map((topic) => topicId(topic) === topicId(course) ? course : topic)
        : [course, ...current]);
      setAdminForm(emptyTopicForm());
      setEditingTopicId(null);
      notify(isEditing ? "Topic updated." : "Topic published to the library.");
    } catch (error) {
      notify(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteTopic(topic) {
    if (!window.confirm(`Delete “${topic.course}” and its lessons?`)) return;
    try {
      await request(`/admin/courses/${topicId(topic)}`, { method: "DELETE" });
      setTopics((current) => current.filter((item) => topicId(item) !== topicId(topic)));
      if (editingTopicId === topicId(topic)) {
        setEditingTopicId(null);
        setAdminForm(emptyTopicForm());
      }
      notify("Topic removed from the library.");
    } catch (error) {
      notify(error.message);
    }
  }

  if (!authReady || (initialView === "auth" && user)) {
    const message = initialView === "auth"
      ? "Redirecting to your workspace..."
      : initialView === "admin"
        ? "Checking admin access..."
        : "Loading your workspace...";
    return <main className="lp-shell lp-admin-loading">{message}</main>;
  }

  return (
    <main className="lp-shell">
      <header className="lp-header">
        <button className="lp-brand" onClick={() => user?.admin ? navigate("admin", "/admin") : navigate("home", "/")} aria-label={user?.admin ? "Admin dashboard" : "Learning library home"}>
          <span className="lp-brand-mark">L</span>
          <span>learn<span className="lp-brand-slash">/</span>loop</span>
        </button>
        {!user?.admin && <label className="lp-header-search">
          <span aria-hidden="true">⌕</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search topics, skills..." />
        </label>}
        <nav className="lp-nav" aria-label="Main navigation">
          {!user?.admin && <button className={view === "home" || view === "reader" ? "is-active" : ""} onClick={() => navigate("home", "/")}>Learn</button>}
          {user && !user.admin && <button className={view === "my-courses" ? "is-active" : ""} onClick={() => navigate("my-courses", "/learning")}>My progress</button>}
          {user?.admin && <button className={view === "admin" ? "is-active" : ""} onClick={() => navigate("admin", "/admin")}>Admin dashboard</button>}
        </nav>
        <div className="lp-account">
          {user ? (
            <>
              <button className="lp-user" onClick={() => navigate("profile", "/profile")} aria-label="Open profile">{user.name?.charAt(0).toUpperCase() || "U"}</button>
              <button className="lp-signout" onClick={logout}>Sign out</button>
            </>
          ) : (
            <button className="lp-signin" onClick={() => openAuth("login")}>Sign in</button>
          )}
        </div>
      </header>

      {message && <div className="lp-toast" role="status">{message}</div>}

      {view === "home" && (
        <LibraryView
          topics={filteredTopics}
          allTopics={topics}
          categories={categories}
          category={category}
          setCategory={setCategory}
          progress={progress}
          completedTotal={completedTotal}
          lessonTotal={lessonTotal}
          openTopic={openTopic}
          join={() => openAuth("register")}
          user={user}
          selectedCourses={selectedCourses}
          selectionTopicId={selectionTopicId}
          setSelectionTopicId={setSelectionTopicId}
          selectCourse={selectCourse}
          savingCourse={savingCourse}
        />
      )}
      {view === "reader" && activeTopic && activeLesson && (
        <ReaderView
          topic={activeTopic}
          lesson={activeLesson}
          lessonIndex={activeLessonIndex}
          progress={completionFor(activeTopic, progress)}
          onBack={() => navigate("home", "/")}
          onChooseLesson={changeLesson}
          onToggleComplete={(complete) => toggleLesson(activeTopic, activeLesson, complete)}
          onNext={() => changeLesson(Math.min(activeLessonIndex + 1, activeTopic.lessons.length - 1))}
        />
      )}
      {view === "my-courses" && (
        <ProgressView
          topics={topics}
          progress={progress}
          completedTotal={completedTotal}
          lessonTotal={lessonTotal}
          openTopic={openTopic}
          explore={() => navigate("home", "/")}
          user={user}
          selectedCourses={selectedCourses}
          selectedCoursesError={selectedCoursesError}
          cancellingCourseId={cancellingCourseId}
          cancelCourse={cancelCourse}
        />
      )}
      {view === "auth" && (
        <AuthView
          mode={authMode}
          form={auth}
          setMode={(mode) => {
            setAuthMode(mode);
            router.push(mode === "login" ? "/login" : "/register");
          }}
          onChange={(event) => setAuth((current) => ({ ...current, [event.target.name]: event.target.value }))}
          onSubmit={submitAuth}
          busy={busy}
        />
      )}
      {view === "admin" && user?.admin && (
        <AdminView
          topics={topics}
          section={adminSection}
          onSectionChange={setAdminSection}
          form={adminForm}
          editingTopicId={editingTopicId}
          busy={busy}
          learnerProgress={learnerProgress}
          learnerProgressLoading={learnerProgressLoading}
          learnerProgressError={learnerProgressError}
          refreshLearnerProgress={refreshLearnerProgress}
          updateField={updateAdminForm}
          updateLesson={updateAdminLesson}
          addLesson={() => updateAdminForm("lessons", [...adminForm.lessons, emptyLesson()])}
          removeLesson={(index) => updateAdminForm("lessons", adminForm.lessons.filter((_, lessonIndex) => lessonIndex !== index))}
          onSubmit={saveTopic}
          onEdit={editTopic}
          onDelete={deleteTopic}
          onCancelEdit={() => { setEditingTopicId(null); setAdminForm(emptyTopicForm()); }}
        />
      )}
      {view === "profile" && user && (
        <ProfileView user={user} completedTotal={completedTotal} lessonTotal={lessonTotal} />
      )}
    </main>
  );
}

function emptyLesson() {
  return { title: "", summary: "", content: "", minutes: 10 };
}

function emptyTopicForm() {
  return {
    course: "",
    category: "General",
    description: "",
    level: "Beginner",
    duration: "Self-paced",
    outcomes: "",
    skills: "",
    lessons: [emptyLesson()],
  };
}

function formatLearningDate(value) {
  const dateValue = String(value).slice(0, 10);
  const date = new Date(`${dateValue}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function CourseSelectionForm({ topic, saving, onCancel, onSubmit }) {
  const [skills, setSkills] = useState(topic.skills || []);
  const [learningDate, setLearningDate] = useState("");
  const [learningTime, setLearningTime] = useState("09:00");
  const [error, setError] = useState("");
  const today = new Date();
  const minimumDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  function toggleSkill(skill) {
    setSkills((current) => current.includes(skill)
      ? current.filter((item) => item !== skill)
      : [...current, skill]);
  }

  function submit(event) {
    event.preventDefault();
    if (!skills.length) {
      setError("Choose at least one skill for this course.");
      return;
    }
    if (!learningDate) {
      setError("Choose the date you plan to study.");
      return;
    }
    setError("");
    onSubmit({ skills, learningDate, learningTime });
  }

  return (
    <form className="lp-course-selection" onSubmit={submit}>
      <p className="lp-course-selection-title">Plan your learning</p>
      <fieldset>
        <legend>Choose skills to focus on</legend>
        <div className="lp-skill-options">
          {(topic.skills || []).map((skill) => (
            <label key={skill}>
              <input type="checkbox" checked={skills.includes(skill)} onChange={() => toggleSkill(skill)} />
              <span>{skill}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {(!topic.skills || topic.skills.length === 0) && <p className="lp-course-form-error">This course has no skills to select yet.</p>}
      <div className="lp-course-schedule-fields">
        <label>First study date<input type="date" min={minimumDate} value={learningDate} onChange={(event) => setLearningDate(event.target.value)} required /></label>
        <label>Study time<input type="time" value={learningTime} onChange={(event) => setLearningTime(event.target.value)} required /></label>
      </div>
      {error && <p className="lp-course-form-error" role="alert">{error}</p>}
      <div className="lp-course-form-actions">
        <button className="lp-primary-button" type="submit" disabled={saving || !topic.skills?.length}>{saving ? "Adding..." : "Add course to my plan"}<span aria-hidden="true">→</span></button>
        <button className="lp-course-dismiss" type="button" onClick={onCancel} disabled={saving}>Cancel</button>
      </div>
    </form>
  );
}

function LibraryView({
  topics,
  allTopics,
  categories,
  category,
  setCategory,
  progress,
  completedTotal,
  lessonTotal,
  openTopic,
  join,
  user,
  selectedCourses,
  selectionTopicId,
  setSelectionTopicId,
  selectCourse,
  savingCourse,
}) {
  return (
    <div className="lp-page">
      <section className="lp-welcome">
        <div>
          <p className="lp-kicker">THE LEARNING LIBRARY</p>
          <h1>Learn at your pace.<br /><span>Keep your progress.</span></h1>
          <p className="lp-welcome-copy">Focused, practical lessons for curious builders. Pick a topic and continue from wherever you are.</p>
        </div>
        <div className="lp-welcome-stats">
          <div><strong>{allTopics.length}</strong><span>Topics</span></div>
          <div><strong>{completedTotal}<small>/{lessonTotal}</small></strong><span>Lessons complete</span></div>
          <button onClick={user ? () => document.getElementById("topic-library")?.scrollIntoView({ behavior: "smooth" }) : join}>
            {user ? "Browse library" : "Create free account"}<span aria-hidden="true">↗</span>
          </button>
        </div>
      </section>

      <div className="lp-section-title" id="topic-library">
        <div><p className="lp-kicker">START HERE</p><h2>Explore topics</h2></div>
        <span>{topics.length} {topics.length === 1 ? "topic" : "topics"}</span>
      </div>

      <div className="lp-library-layout">
        <aside className="lp-category-rail" aria-label="Topic categories">
          <p className="lp-rail-title">CATEGORIES</p>
          {categories.map((item) => (
            <button className={category === item ? "selected" : ""} key={item} onClick={() => setCategory(item)}>
              <span className="lp-category-dot" />{item}<span className="lp-category-count">{item === "All topics" ? allTopics.length : allTopics.filter((topic) => (topic.category || "General") === item).length}</span>
            </button>
          ))}
          {!user && <div className="lp-rail-note"><strong>Track your study</strong><p>Create an account to sync completed lessons across sessions.</p><button onClick={join}>Join free <span aria-hidden="true">→</span></button></div>}
        </aside>

        <section className="lp-topic-list" aria-label="Available topics">
          {topics.length === 0 ? (
            <div className="lp-empty"><h3>No matching topics</h3><p>Try a different search or category.</p></div>
          ) : topics.map((topic, index) => {
            const lessonCount = topic.lessons?.length || 0;
            const completed = completionFor(topic, progress).length;
            const percent = lessonCount ? Math.round((completed / lessonCount) * 100) : 0;
            return (
              <article className="lp-topic-row" key={topicId(topic)}>
                <div className={`lp-topic-index tone-${index % 4}`}>{String(index + 1).padStart(2, "0")}</div>
                <div className="lp-topic-info">
                  <div className="lp-topic-meta"><span>{topic.category || "General"}</span><span>{topic.level || "All levels"}</span></div>
                  <h3>{topic.course}</h3>
                  <p>{topic.description}</p>
                  <div className="lp-topic-tags">{(topic.skills || []).slice(0, 4).map((skill) => <span key={skill}>{skill}</span>)}</div>
                  {user && !user.admin && <div className="lp-topic-course-action">
                    {selectedCourses.some((course) => course.course === topic.course) ? (
                      <span className="lp-selected-label">Added to your courses</span>
                    ) : (
                      <button className="lp-text-button" onClick={() => setSelectionTopicId(selectionTopicId === topicId(topic) ? null : topicId(topic))}>
                        {selectionTopicId === topicId(topic) ? "Close selection" : "Select course"} <span aria-hidden="true">{selectionTopicId === topicId(topic) ? "−" : "＋"}</span>
                      </button>
                    )}
                  </div>}
                  {selectionTopicId === topicId(topic) && user && !user.admin && (
                    <CourseSelectionForm
                      topic={topic}
                      saving={savingCourse}
                      onCancel={() => setSelectionTopicId(null)}
                      onSubmit={(selection) => selectCourse(topic, selection)}
                    />
                  )}
                </div>
                <div className="lp-topic-progress">
                  <span>{completed}/{lessonCount} lessons</span>
                  <div className="lp-progress-track"><i style={{ width: `${percent}%` }} /></div>
                </div>
                <button className="lp-topic-open" onClick={() => openTopic(topic)} aria-label={`Open ${topic.course}`}>→</button>
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
}

function ReaderView({ topic, lesson, lessonIndex, progress, onBack, onChooseLesson, onToggleComplete, onNext }) {
  const completed = progress.includes(lessonId(lesson));
  const lessons = topic.lessons || [];
  const percent = lessons.length ? Math.round((progress.length / lessons.length) * 100) : 0;
  return (
    <div className="lp-reader-page">
      <button className="lp-back" onClick={onBack}><span aria-hidden="true">←</span> All topics</button>
      <div className="lp-reader-heading">
        <div><p className="lp-breadcrumb">{topic.category || "Topic library"} <span>/</span> {topic.course}</p><h1>{topic.course}</h1><p>{topic.description}</p></div>
        <div className="lp-reader-overview"><span>{progress.length} of {lessons.length} lessons</span><strong>{percent}%</strong><div className="lp-progress-track"><i style={{ width: `${percent}%` }} /></div></div>
      </div>
      <div className="lp-reader-layout">
        <aside className="lp-lesson-sidebar">
          <div className="lp-sidebar-top"><span>IN THIS TOPIC</span><strong>{lessons.length} lessons</strong></div>
          {lessons.map((item, index) => {
            const isDone = progress.includes(lessonId(item));
            return <button key={lessonId(item)} className={`lp-lesson-nav ${index === lessonIndex ? "active" : ""}`} onClick={() => onChooseLesson(index)}>
              <span className={`lp-lesson-check ${isDone ? "done" : ""}`}>{isDone ? "✓" : String(index + 1).padStart(2, "0")}</span>
              <span className="lp-lesson-nav-copy"><strong>{item.title}</strong><small>{item.minutes || 10} min read</small></span>
            </button>;
          })}
        </aside>
        <article className="lp-article">
          <div className="lp-article-meta"><span>LESSON {String(lessonIndex + 1).padStart(2, "0")}</span><span>{lesson.minutes || 10} MIN READ</span></div>
          <h2>{lesson.title}</h2>
          <p className="lp-article-summary">{lesson.summary}</p>
          <div className="lp-article-content">{lesson.content}</div>
          <div className="lp-lesson-actions">
            <button className={completed ? "lp-complete-button is-complete" : "lp-complete-button"} onClick={() => onToggleComplete(!completed)}>
              <span aria-hidden="true">{completed ? "✓" : "○"}</span>{completed ? "Completed" : "Mark as complete"}
            </button>
            {lessonIndex < lessons.length - 1 && <button className="lp-next-button" onClick={onNext}>Next lesson <span aria-hidden="true">→</span></button>}
          </div>
          {topic.outcomes?.length > 0 && <div className="lp-outcomes"><h3>In this topic, you will</h3><ul>{topic.outcomes.map((outcome) => <li key={outcome}>{outcome}</li>)}</ul></div>}
        </article>
      </div>
    </div>
  );
}

function ProgressView({
  topics,
  progress,
  completedTotal,
  lessonTotal,
  openTopic,
  explore,
  user,
  selectedCourses,
  selectedCoursesError,
  cancellingCourseId,
  cancelCourse,
}) {
  return (
    <div className="lp-page lp-progress-page">
      <div className="lp-page-heading"><div><p className="lp-kicker">YOUR STUDY SPACE</p><h1>My learning</h1><p>Manage your course schedule and pick up lessons where you left off.</p></div><button className="lp-secondary-button" onClick={explore}>Explore topics <span aria-hidden="true">↗</span></button></div>
      {!user && <div className="lp-sync-note">You are studying as a guest. Sign in to sync progress across devices.</div>}
      {user && !user.admin && <section className="lp-selected-courses">
        <div className="lp-section-title"><div><p className="lp-kicker">YOUR SCHEDULE</p><h2>Selected courses</h2></div><span>{selectedCourses.length} {selectedCourses.length === 1 ? "course" : "courses"}</span></div>
        {selectedCoursesError && <p className="lp-course-error" role="alert">{selectedCoursesError}</p>}
        {selectedCourses.length === 0 ? <div className="lp-empty"><h3>No courses selected yet</h3><p>Choose a course from the library to build your learning schedule.</p></div> : (
          <div className="lp-selected-course-list">
            {selectedCourses.map((course) => (
              <article className="lp-selected-course" key={course.id}>
                <div className="lp-selected-course-main">
                  <p className="lp-kicker">LEARNING PLAN</p>
                  <h3>{course.course}</h3>
                  <p className="lp-course-date">{formatLearningDate(course.learningDate)} · {course.learningTime}</p>
                  <div className="lp-topic-tags">{course.skills.map((skill) => <span key={skill}>{skill}</span>)}</div>
                </div>
                <button className="lp-cancel-course" onClick={() => cancelCourse(course)} disabled={String(cancellingCourseId) === String(course.id)}>
                  {String(cancellingCourseId) === String(course.id) ? "Cancelling..." : "Cancel course"}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>}
      <div className="lp-progress-summary">
        <div><span>LESSONS COMPLETED</span><strong>{completedTotal}<small> / {lessonTotal}</small></strong></div>
        <div><span>TOPICS STARTED</span><strong>{topics.filter((topic) => completionFor(topic, progress).length).length}<small> / {topics.length}</small></strong></div>
        <div className="lp-summary-bar"><div className="lp-progress-track"><i style={{ width: `${lessonTotal ? Math.round(completedTotal / lessonTotal * 100) : 0}%` }} /></div><small>{lessonTotal ? Math.round(completedTotal / lessonTotal * 100) : 0}% of all lessons</small></div>
      </div>
      <div className="lp-section-title"><div><p className="lp-kicker">CONTINUE LEARNING</p><h2>Your topics</h2></div></div>
      <div className="lp-progress-list">
        {topics.map((topic) => {
          const count = topic.lessons?.length || 0;
          const done = completionFor(topic, progress).length;
          const percent = count ? Math.round(done / count * 100) : 0;
          return <article className="lp-progress-topic" key={topicId(topic)}>
            <div><span>{topic.category || "General"}</span><h3>{topic.course}</h3><p>{done} of {count} lessons complete</p></div>
            <div className="lp-progress-topic-bar"><div className="lp-progress-track"><i style={{ width: `${percent}%` }} /></div><span>{percent}%</span></div>
            <button className="lp-text-button" onClick={() => openTopic(topic)}>{done ? "Continue" : "Start learning"}<span aria-hidden="true">→</span></button>
          </article>;
        })}
        {topics.length === 0 && <div className="lp-empty"><h3>Your next lesson is waiting.</h3><p>Choose a topic from the library to get started.</p></div>}
      </div>
    </div>
  );
}

function AuthView({ mode, form, setMode, onChange, onSubmit, busy }) {
  return (
    <div className="lp-auth-page">
      <div className="lp-auth-aside"><span className="lp-auth-mark">L</span><p className="lp-kicker">LEARN / LOOP</p><h1>Curiosity,<br /><span>with momentum.</span></h1><p>Save your place, build a steady habit, and make each lesson count.</p></div>
      <form className="lp-auth-form" onSubmit={onSubmit}>
        <p className="lp-kicker">{mode === "login" ? "WELCOME BACK" : "GET STARTED"}</p>
        <h2>{mode === "login" ? "Sign in to learn" : "Create your account"}</h2>
        {mode === "register" && <label>Name<input required name="name" autoComplete="name" value={form.name} onChange={onChange} /></label>}
        <label>Email<input required name="email" type="email" autoComplete="email" value={form.email} onChange={onChange} /></label>
        <label>Password<input required minLength="6" name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={form.password} onChange={onChange} /></label>
        <button className="lp-primary-button" disabled={busy}>{busy ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}<span aria-hidden="true">→</span></button>
        <p className="lp-auth-switch">{mode === "login" ? "New to the library?" : "Already have an account?"}<button type="button" onClick={() => setMode(mode === "login" ? "register" : "login")}>{mode === "login" ? "Create an account" : "Sign in"}</button></p>
      </form>
    </div>
  );
}

function AdminView({
  topics,
  section,
  onSectionChange,
  form,
  editingTopicId,
  busy,
  learnerProgress,
  learnerProgressLoading,
  learnerProgressError,
  refreshLearnerProgress,
  updateField,
  updateLesson,
  addLesson,
  removeLesson,
  onSubmit,
  onEdit,
  onDelete,
  onCancelEdit,
}) {
  return (
    <div className="lp-page lp-admin-page">
      <div className="lp-page-heading"><div><p className="lp-kicker">ADMINISTRATION</p><h1>Admin dashboard</h1><p>Manage your learning library and keep track of learner progress.</p></div><span className="lp-admin-badge">ADMIN ACCESS</span></div>
      <nav className="lp-admin-tabs" aria-label="Admin dashboard sections">
        <button className={section === "topics" ? "is-active" : ""} aria-pressed={section === "topics"} onClick={() => onSectionChange("topics")}>Manage topics</button>
        <button className={section === "progress" ? "is-active" : ""} aria-pressed={section === "progress"} onClick={() => onSectionChange("progress")}>Learner progress</button>
      </nav>
      {section === "topics" ? <>
        <div className="lp-admin-metrics"><div><span>PUBLISHED TOPICS</span><strong>{topics.length}</strong></div><div><span>LESSONS IN LIBRARY</span><strong>{topics.reduce((total, topic) => total + (topic.lessons?.length || 0), 0)}</strong></div><div><span>CATEGORIES</span><strong>{new Set(topics.map((topic) => topic.category || "General")).size}</strong></div></div>
        <div className="lp-admin-layout">
        <form className="lp-editor" onSubmit={onSubmit}>
          <div className="lp-editor-heading"><div><p className="lp-kicker">{editingTopicId ? "EDIT TOPIC" : "NEW TOPIC"}</p><h2>{editingTopicId ? "Update the lesson path" : "Build a lesson path"}</h2></div>{editingTopicId && <button className="lp-text-button" type="button" onClick={onCancelEdit}>Cancel edit</button>}</div>
          <div className="lp-form-grid">
            <label>Topic title<input required value={form.course} onChange={(event) => updateField("course", event.target.value)} placeholder="e.g. JavaScript fundamentals" /></label>
            <label>Category<input required value={form.category} onChange={(event) => updateField("category", event.target.value)} placeholder="e.g. JavaScript" /></label>
          </div>
          <label>Short description<textarea required rows="3" value={form.description} onChange={(event) => updateField("description", event.target.value)} placeholder="What will learners be able to do?" /></label>
          <div className="lp-form-grid">
            <label>Level<input required value={form.level} onChange={(event) => updateField("level", event.target.value)} /></label>
            <label>Estimated duration<input required value={form.duration} onChange={(event) => updateField("duration", event.target.value)} /></label>
          </div>
          <label>Learning outcomes <small>Separate outcomes with commas</small><input required value={form.outcomes} onChange={(event) => updateField("outcomes", event.target.value)} placeholder="Understand syntax, Build a small feature" /></label>
          <label>Skills <small>Separate skills with commas</small><input required value={form.skills} onChange={(event) => updateField("skills", event.target.value)} placeholder="JavaScript, DOM, APIs" /></label>
          <div className="lp-lessons-heading"><div><p className="lp-kicker">LESSON CONTENT</p><h3>Order the learning</h3></div><button type="button" className="lp-secondary-button" onClick={addLesson}><span aria-hidden="true">+</span> Add lesson</button></div>
          {form.lessons.map((lesson, index) => <fieldset className="lp-lesson-editor" key={index}>
            <div className="lp-lesson-editor-top"><legend>Lesson {String(index + 1).padStart(2, "0")}</legend>{form.lessons.length > 1 && <button type="button" className="lp-text-button lp-delete-button" onClick={() => removeLesson(index)}>Remove</button>}</div>
            <label>Lesson title<input required value={lesson.title} onChange={(event) => updateLesson(index, "title", event.target.value)} /></label>
            <label>Summary<input required value={lesson.summary} onChange={(event) => updateLesson(index, "summary", event.target.value)} /></label>
            <label>Lesson content<textarea required rows="7" value={lesson.content} onChange={(event) => updateLesson(index, "content", event.target.value)} placeholder="Write the lesson explanation and practical exercise..." /></label>
            <label className="lp-minutes-field">Reading time (minutes)<input required type="number" min="1" value={lesson.minutes} onChange={(event) => updateLesson(index, "minutes", event.target.value)} /></label>
          </fieldset>)}
          <button className="lp-primary-button" disabled={busy}>{busy ? "Saving..." : editingTopicId ? "Save topic changes" : "Publish topic"}<span aria-hidden="true">→</span></button>
        </form>
        <section className="lp-admin-list"><div className="lp-editor-heading"><div><p className="lp-kicker">LIBRARY CONTENT</p><h2>Published topics</h2></div><span>{topics.length}</span></div>
          {topics.map((topic) => <article className="lp-admin-topic" key={topicId(topic)}><div className="lp-admin-topic-info"><span>{topic.category || "General"} · {topic.lessons?.length || 0} lessons</span><h3>{topic.course}</h3><p>{topic.description}</p></div><div className="lp-admin-topic-actions"><button onClick={() => onEdit(topic)}>Edit</button><button className="lp-delete-button" onClick={() => onDelete(topic)}>Delete</button></div></article>)}
          {topics.length === 0 && <div className="lp-empty"><p>No topics have been published yet.</p></div>}
        </section>
        </div>
      </> : <LearnerProgressView
        users={learnerProgress}
        loading={learnerProgressLoading}
        error={learnerProgressError}
        onRefresh={refreshLearnerProgress}
      />}
    </div>
  );
}

function LearnerProgressView({ users, loading, error, onRefresh }) {
  const activeLearners = users.filter((user) => user.completedLessons > 0).length;
  const completedLessons = users.reduce((total, user) => total + user.completedLessons, 0);

  return (
    <section className="lp-learners">
      <div className="lp-learners-heading">
        <div><p className="lp-kicker">LEARNER OVERVIEW</p><h2>Progress by learner</h2><p>Review completed lessons for each learner account.</p></div>
        <button className="lp-secondary-button" type="button" onClick={onRefresh} disabled={loading}>{loading ? "Refreshing..." : "Refresh progress"} <span aria-hidden="true">↻</span></button>
      </div>
      <div className="lp-admin-metrics">
        <div><span>LEARNER ACCOUNTS</span><strong>{users.length}</strong></div>
        <div><span>ACTIVE LEARNERS</span><strong>{activeLearners}</strong></div>
        <div><span>LESSONS COMPLETED</span><strong>{completedLessons}</strong></div>
      </div>
      {error && <div className="lp-learners-error" role="alert"><span>{error}</span><button type="button" onClick={onRefresh}>Try again</button></div>}
      {loading && users.length === 0 ? <div className="lp-empty"><p>Loading learner progress...</p></div> : error && users.length === 0 ? null : users.length === 0 ? (
        <div className="lp-empty"><h3>No learner accounts yet</h3><p>New learner accounts will appear here.</p></div>
      ) : (
        <div className="lp-learner-list">
          {users.map((user) => {
            const percent = user.totalLessons ? Math.round((user.completedLessons / user.totalLessons) * 100) : 0;
            return (
              <details className="lp-learner-card" key={user.id}>
                <summary>
                  <span className="lp-learner-avatar" aria-hidden="true">{user.name?.charAt(0).toUpperCase() || "L"}</span>
                  <span className="lp-learner-identity"><strong>{user.name}</strong><small>{user.email}</small></span>
                  <span className="lp-learner-completion"><strong>{user.completedLessons} / {user.totalLessons}</strong><small>lessons completed</small></span>
                  <span className="lp-learner-percent">{percent}%</span>
                  <span className="lp-learner-chevron" aria-hidden="true">⌄</span>
                </summary>
                <div className="lp-learner-details">
                  {user.topics.length ? user.topics.map((topic) => {
                    const topicPercent = topic.totalLessons ? Math.round((topic.completedLessons / topic.totalLessons) * 100) : 0;
                    return (
                      <div className="lp-learner-topic" key={topic.topicId}>
                        <div><strong>{topic.course}</strong><span>{topic.completedLessons} of {topic.totalLessons} lessons</span></div>
                        <div className="lp-progress-track" role="progressbar" aria-label={`${topic.course} progress`} aria-valuenow={topicPercent} aria-valuemin="0" aria-valuemax="100"><i style={{ width: `${topicPercent}%` }} /></div>
                        <small>{topicPercent}%</small>
                      </div>
                    );
                  }) : <p className="lp-learner-no-progress">No lesson progress recorded yet.</p>}
                </div>
              </details>
            );
          })}
        </div>
      )}
    </section>
  );
}

function ProfileView({ user, completedTotal, lessonTotal }) {
  return <div className="lp-page lp-profile-page"><div className="lp-profile-card"><div className="lp-profile-avatar">{user.name?.charAt(0).toUpperCase() || "U"}</div><div><p className="lp-kicker">{user.admin ? "ADMIN ACCOUNT" : "LEARNER PROFILE"}</p><h1>{user.name}</h1><p>{user.email}</p></div></div>{user.admin ? <div className="lp-admin-badge lp-profile-role">ADMIN ACCESS</div> : <div className="lp-progress-summary"><div><span>LESSONS COMPLETED</span><strong>{completedTotal}<small> / {lessonTotal}</small></strong></div><div><span>ACCOUNT TYPE</span><strong>Learner</strong></div><div><span>STUDY MODE</span><strong>Self-paced</strong></div></div>}</div>;
}
