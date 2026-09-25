# learning/blog

learning/blog is an online learning platform. Administrators publish structured courses, and learners explore the course material, read lessons, and add a practice schedule to their personal learning plan.

## How Learning Works

Adding a course is only the admin setup step. The learner journey is:

1. **Open the catalog**

	Visit the home page. Courses are loaded from MongoDB through `GET /api/catalog`.

2. **Choose a course**

	Open a course card to see its description, skill tags, level, duration, learning outcomes, and lesson roadmap.

3. **Read the lessons**

	Select a lesson from the roadmap. Each lesson includes a title, a short goal, practical content, and an estimated time.

4. **Understand the result**

	Read the “By the end, you can” section before enrolling. It tells the learner what they should be able to do after finishing the course.

5. **Create a learning plan**

	Choose a learning date and time, then select **Add to my learning**. The selection is stored in MongoDB and connected to the logged-in user.

6. **Return to My learning**

	The learner can view selected courses, learning dates and times, and covered skills.

7. **Cancel a selection**

	A learner can cancel only their own course selection. Cancelling removes the scheduled selection; it does not delete the course from the catalog.

## Admin Workflow

1. Log in with an administrator account.
2. Open **Admin desk**.
3. Publish a course with its name, description, level, duration, outcomes, and skills.
4. Add at least one lesson. In the admin form, enter one lesson per line using:

	```text
	Lesson title | Short summary | Practical lesson content | 30
	```

	The last value is the estimated number of minutes.
5. Review or remove catalog courses from the admin course management area.

The course catalog and learner selections are separate MongoDB collections:

- `CourseCatalog`: reusable learning material published by admins.
- `Course`: a learner's personal selection, date, time, and covered skills.

## Demo Accounts

The seed command creates these development accounts:

```text
Admin
Email: admin@learningblog.dev
Password: Admin123!

Learner
Email: learner@learningblog.dev
Password: Learner123!
```

Change these credentials before using the project outside local development.

## Setup

### Backend

Create `backend/.env` with:

```env
PORT=5000
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-long-random-jwt-secret
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

Install dependencies and seed MongoDB:

```bash
cd backend
npm install
npm run seed
npm run dev
```

The seed command creates catalog records, practical lesson content, learner selections, and Cloudinary course images. It does not use a JSON data file.

### Frontend

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The frontend calls the backend at `http://localhost:5000/api` by default. To use another API URL, set `NEXT_PUBLIC_API_URL`.

## Routes

### Frontend

| Route | Purpose |
| --- | --- |
| `/` | Public course catalog and discovery |
| `/login` | Learner or admin login |
| `/register` | Learner registration |
| `/learning` | Learner's selected courses |
| `/profile` | Account information |
| `/admin` | Admin course management |

### Backend

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/catalog` | Public MongoDB course catalog |
| `POST` | `/api/auth/register` | Register a learner |
| `POST` | `/api/auth/login` | Log in with JWT cookie |
| `POST` | `/api/auth/logout` | Clear the JWT cookie |
| `GET` | `/api/auth/me` | Get the logged-in user |
| `POST` | `/api/courses` | Add a course to the learner's plan |
| `GET` | `/api/courses` | Get the learner's own selections |
| `DELETE` | `/api/courses/:id` | Cancel the learner's own selection |
| `POST` | `/api/admin/courses` | Publish a catalog course |
| `GET` | `/api/admin/courses` | List catalog courses as admin |
| `PUT` | `/api/admin/courses/:id` | Update a catalog course |
| `DELETE` | `/api/admin/courses/:id` | Delete a catalog course |

## Validation

```bash
cd frontend
npm run lint
npm run build
```

The current backend test script is a placeholder and does not contain automated tests.