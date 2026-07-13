# Travel Planner

A full-stack web application for planning and organizing trips. Users can create trips, build day-by-day itineraries, and attach photos to activities.

## Live Demo

- **Frontend:** https://travel-planner-nu-khaki.vercel.app
- **Backend API:** https://travel-planner-server-fvd5.onrender.com

> Note: the backend runs on Render's free tier and may take ~30 seconds to wake up after a period of inactivity.

---

## Features

- User registration and login with JWT authentication (with confirm-password validation)
- Password encryption with bcrypt (pre-save hook, `select: false` on the hash)
- Create, edit, and delete trips
- Day-by-day itinerary planner for each trip
- Add, edit, and delete activities per day
- Attach, view, and remove photos for each activity (stored in MongoDB)
- Protected routes — only logged-in users can access their own data
- Rate limiting and Helmet security headers on the API
- Loading states, error states, 404 page, and error boundary
- Fully responsive UI

---

## Screenshots

<!-- TODO: Add 2-3 screenshots of the app here, e.g.: -->
<!-- ![Dashboard](docs/screenshots/dashboard.png) -->
<!-- ![Trip Planner](docs/screenshots/planner.png) -->

*Screenshots coming soon — see the [live demo](https://travel-planner-nu-khaki.vercel.app) in the meantime.*

---

## Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 19 | UI framework |
| React Router v7 | Client-side routing + 404 catch-all |
| Redux Toolkit | Global state management for trips |
| Context API | Authentication state |
| Axios | HTTP requests with JWT request + 401 response interceptors |
| Custom hooks (`useFetch`, `useAuth`) | Reusable stateful logic |
| React.lazy + Suspense | Code splitting / lazy loading |
| React.memo + useMemo + useCallback | Performance optimization |

### Backend
| Technology | Purpose |
|-----------|---------|
| Node.js + Express | REST API server |
| MongoDB + Mongoose | Database and schema modeling |
| JWT (jsonwebtoken) | Authentication tokens |
| bcryptjs | Password hashing |
| Multer | File upload (stored in MongoDB) |
| Joi | Request validation |
| Helmet | Secure HTTP headers |
| express-rate-limit | Brute-force / abuse protection |

---

## API Endpoints

All protected routes require an `Authorization: Bearer <token>` header.

### Auth
| Method | Route | Description | Protected |
|--------|-------|-------------|-----------|
| POST | `/api/register` | Register a new user, returns JWT | No |
| POST | `/api/login` | Login, returns JWT | No |
| GET | `/api/me` | Get the currently logged-in user | Yes |

### Trips
| Method | Route | Description | Protected |
|--------|-------|-------------|-----------|
| GET | `/api/trips` | Get all trips of the logged-in user | Yes |
| GET | `/api/trips/:id` | Get a single trip | Yes |
| POST | `/api/trips` | Create a trip | Yes |
| PUT | `/api/trips/:id` | Update a trip | Yes |
| DELETE | `/api/trips/:id` | Delete a trip + all its activities | Yes |

### Activities (nested under a trip)
| Method | Route | Description | Protected |
|--------|-------|-------------|-----------|
| GET | `/api/trips/:tripId/activities` | Get all activities for a trip | Yes |
| POST | `/api/trips/:tripId/activities` | Create an activity | Yes |
| PUT | `/api/trips/:tripId/activities/:activityId` | Update an activity | Yes |
| DELETE | `/api/trips/:tripId/activities/:activityId` | Delete an activity | Yes |
| POST | `/api/trips/:tripId/activities/:activityId/image` | Upload a photo (multipart, field `image`) | Yes |
| GET | `/api/trips/:tripId/activities/:activityId/image` | Get the photo bytes | Yes |
| DELETE | `/api/trips/:tripId/activities/:activityId/image` | Remove the photo | Yes |

A ready-to-import **Postman collection** is included at [`travel-planner-server/postman_collection.json`](travel-planner-server/postman_collection.json).

---

## Project Structure

```
travel-planner/
├── src/                        # React frontend
│   ├── api/                    # Axios instance + interceptors
│   ├── components/             # Reusable components (ActivityCard, ProtectedRoute, ErrorBoundary)
│   ├── context/                # Auth Context
│   ├── hooks/                  # Custom hooks (useFetch)
│   ├── pages/                  # Page components (incl. 404 NotFound)
│   ├── store/                  # Redux store and slices
│   └── styles/                 # Global CSS variables
└── travel-planner-server/      # Express backend
    ├── controllers/            # Route logic (auth, trips, activities)
    ├── middleware/             # Auth, validation, upload, rate limiting, error handling
    ├── models/                 # Mongoose schemas (User, Trip, Activity)
    ├── routes/                 # Express routers
    ├── utils/                  # AppError class
    └── validators/             # Joi schemas
```

---

## Running Locally

### Prerequisites
- Node.js installed
- MongoDB installed and running locally (or a MongoDB Atlas connection string)

### Backend
```bash
cd travel-planner-server
npm install
```

Create a `.env` file inside `travel-planner-server/` (see `.env.example`):
```
DATABASE_URL=mongodb://127.0.0.1:27017/travel_planner
JWT_SECRET=your_secret_key
FRONTEND_URL=http://localhost:3000
```

```bash
npm start
```

### Frontend
```bash
# from the project root
npm install
npm start
```

Open http://localhost:3000 in your browser.

---

## Team

| Member | Role |
|--------|------|
| Daniela | Solo project — backend, frontend, database design, deployment |
