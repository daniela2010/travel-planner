# Travel Planner

A full-stack web application for planning and organizing trips. Users can create trips, build day-by-day itineraries, and attach photos to activities.

## Live Demo

- **Frontend:** https://travel-planner-nu-khaki.vercel.app
- **Backend API:** https://travel-planner-server-fvd5.onrender.com

> Note: the backend runs on Render's free tier and may take ~30 seconds to wake up after a period of inactivity.

---

## Features

- User registration and login with JWT authentication (with confirm-password validation)
- Password hashing with bcrypt (pre-save hook, `select: false` on the hash)
- Create, edit, and delete trips
- Day-by-day itinerary planner for each trip
- Add, edit, and delete activities per day
- Attach, view, and remove photos for each activity (stored in MongoDB)
- Protected routes — only logged-in users can access their own data
- Rate limiting and Helmet security headers on the API
- Loading states, error states, 404 page, and error boundary
- Fully responsive UI
- Automated frontend and backend tests

---

## Screenshots

### Registration
Create an account with client-side validation and password confirmation.

<img width="900" alt="Travel Planner registration page" src="https://github.com/user-attachments/assets/e6e963e7-cddf-4d24-ab67-7bf425ce809c" />

### Login
Sign in securely and start a verified user session.

<img width="900" alt="Travel Planner login page" src="https://github.com/user-attachments/assets/3b1ec22b-5cb0-415b-9527-82dad67fafed" />

### Trip Dashboard
Manage multiple trips, including their dates, budgets, and edit/delete actions.

<img width="900" alt="Travel Planner trip dashboard" src="https://github.com/user-attachments/assets/539c6ecc-c65b-4a40-8705-d50930912889" />

### Day-by-Day Itinerary
Plan activities by day and attach travel confirmations or photos to activities.

<img width="900" alt="Travel Planner day-by-day itinerary" src="https://github.com/user-attachments/assets/9f880066-707a-43ab-ab86-c517e66ab728" />

---

## Architecture

The project is divided into a React frontend and an Express backend:

1. The React frontend is deployed on Vercel. It uses AuthContext for the current user and Redux Toolkit for trip data, loading states, and request errors.
2. A shared Axios client sends JSON or multipart requests to the REST API and attaches the JWT to protected requests.
3. The Express backend is deployed on Render. Requests pass through middleware for security, authentication, validation, rate limiting, and file uploads before reaching route controllers.
4. Controllers use Mongoose models to read and write data in MongoDB Atlas and return JSON responses to the frontend.

### Data Model

```text
User
└── Trips (Trip.userId references User)
    └── Activities (Activity.tripId references Trip)
        └── Optional image stored in the Activity document
```

This creates one-to-many relationships from users to trips and from trips to activities. Deleting a trip also deletes its related activities.

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

### Example Request & Response

`POST /api/login`

Request body:

```json
{
  "email": "user@example.com",
  "password": "123456"
}
```

Response `200 OK`:

```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "665f1a...", "name": "Daniela", "email": "user@example.com" }
}
```

Response `401 Unauthorized` for invalid credentials:

```json
{
  "status": "error",
  "message": "Invalid email or password"
}
```

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
    ├── config/                 # MongoDB connection setup
    ├── middleware/             # Auth, validation, upload, rate limiting, error handling
    ├── models/                 # Mongoose schemas (User, Trip, Activity)
    ├── routes/                 # Express routers
    ├── test/                   # Backend middleware and API tests
    ├── utils/                  # AppError class
    ├── validators/             # Joi schemas
    ├── app.js                  # Express middleware and route configuration
    └── server.js               # Database connection and HTTP listener
```

---

## Environment Variables

### Frontend

| Variable | Required | Description |
|---|---|---|
| `REACT_APP_API_URL` | Production | Backend API URL. Locally, the application defaults to `http://localhost:5000/api`. |

### Backend

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | MongoDB or MongoDB Atlas connection string. |
| `JWT_SECRET` | Yes | Secret used to sign and verify JWT tokens. |
| `FRONTEND_URL` | Yes | Frontend origin permitted by CORS. |
| `PORT` | No | Express server port. Defaults to `5000`. |

Never commit real `.env` files. The repository includes `.env.example` files that document the expected variables without exposing secrets.

---

## Running Locally

### Prerequisites
- Node.js 18 or newer
- MongoDB installed and running locally (or a MongoDB Atlas connection string)

### Backend
```bash
cd travel-planner-server
npm install
```

Create `travel-planner-server/.env` using the backend variables listed above. Example values are available in `travel-planner-server/.env.example`.

```bash
npm start
```

### Frontend
```bash
# from the project root
npm install
npm start
```

The frontend uses `http://localhost:5000/api` by default. To use another backend, create a root `.env` file and set `REACT_APP_API_URL` as shown in `.env.example`.

Open http://localhost:3000 in your browser.

---

## Running Tests

Frontend tests:

```bash
npm test -- --watchAll=false
```

Backend tests:

```bash
cd travel-planner-server
npm test
```

---

## Team

| Member | Role |
|--------|------|
| Daniela | Solo project — backend, frontend, database design, deployment |
