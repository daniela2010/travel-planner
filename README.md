# Travel Planner

A full-stack web application for planning and organizing trips. Users can create trips, build day-by-day itineraries, and attach photos to activities.

## Live Demo

- **Frontend:** https://travel-planner-nu-khaki.vercel.app
- **Backend API:** https://travel-planner-server-fvd5.onrender.com

> Note: the backend runs on Render's free tier and may take ~30 seconds to wake up after a period of inactivity.

---

## Features

- User registration and login with JWT authentication
- Password encryption with bcrypt
- Create, edit, and delete trips
- Day-by-day itinerary planner for each trip
- Add, edit, and delete activities per day
- Attach and view photos for each activity (uploaded to MongoDB)
- Protected routes — only logged-in users can access their own data
- Fully responsive UI

---

## Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 19 | UI framework |
| React Router v7 | Client-side routing |
| Redux Toolkit | Global state management for trips |
| Context API | Authentication state |
| Axios | HTTP requests with JWT interceptor |
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

---

## Project Structure

```
travel-planner/
├── src/                        # React frontend
│   ├── api/                    # Axios instance
│   ├── components/             # Reusable components
│   ├── context/                # Auth Context
│   ├── pages/                  # Page components
│   ├── store/                  # Redux store and slices
│   └── styles/                 # Global CSS variables
└── travel-planner-server/      # Express backend
    ├── controllers/            # Route logic
    ├── middleware/             # Auth, validation, upload, error handling
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

Create a `.env` file inside `travel-planner-server/`:
```
DATABASE_URL=mongodb://127.0.0.1:27017/travel_planner
JWT_SECRET=your_secret_key
FRONTEND_URL=http://localhost:3000
```

```bash
node server.js
```

### Frontend
```bash
# from the project root
npm install
npm start
```

Open http://localhost:3000 in your browser.
