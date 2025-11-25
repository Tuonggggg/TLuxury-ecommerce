# 🌐 E‑Commerce Fullstack Website (MERN + Vite + Tailwind)

A modern, scalable, production‑ready e‑commerce system built with Node.js, Express, MongoDB, React 19, Vite, and TailwindCSS 4.

This project contains a complete backend + frontend architecture, designed for real‑world use with secure authentication, product management, order handling, and admin tools.

---

## 🚀 Features

### 🛒 User Features

* Browse products, categories, filters
* Add to cart & checkout
* Order tracking
* JWT‑based authentication
* Update profile
* Save addresses

### 🛠️ Admin Features

* Product management
* Category management
* Order management
* User management
* Blog/post management
* Voucher management
* Dashboard with charts

---

## 🧱 Tech Stack

### 🔥 Backend

* Node.js + Express.js
* MongoDB + Mongoose
* JWT Authentication
* Bcrypt password hashing
* Cloudinary (image upload)
* SendGrid / Nodemailer (email)
* Multer
* Cron Jobs
* Helmet + Rate Limit + XSS Clean + Mongo Sanitize

### 🎨 Frontend

* React 19 + React Router 7
* Vite
* TailwindCSS 4
* Radix UI + Shadcn UI
* Redux Toolkit
* Tiptap Editor
* Lucide Icons
* Recharts (admin charts)


---

## ⚙️ Project Setup

### ▶ Backend

```bash
cd backend
npm install
npm run dev
```

### ▶ Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 🔑 Environment Variables

### Backend `.env`

```
PORT=5000
MONGO_URI=your_mongo
JWT_SECRET=your_secret
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
SENDGRID_API_KEY=
CLIENT_URL=http://localhost:5173
```

### Frontend `.env`

```
VITE_API_URL=http://localhost:5000/api
```

---

## 📦 Scripts

### Backend

| Script        | Description          |
| ------------- | -------------------- |
| `npm run dev` | Run server (nodemon) |
| `npm start`   | Run in production    |

### Frontend

| Script            | Description        |
| ----------------- | ------------------ |
| `npm run dev`     | Dev mode           |
| `npm run build`   | Build for deploy   |
| `npm run preview` | Preview production |

---

## 🛠 API & Architecture

*(Optional: You can add diagrams here if needed)*

---

## 🔥 Future Improvements

* Integrate MoMo / VNPay
* Realtime chat support
* AI product recommendation system
* Mobile app (React Native)

---

## 👤 Author

Developed by Tuấn Tường


## 📜 License

This project is licensed under the ISC License.
