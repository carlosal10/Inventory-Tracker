# 🧮 Inventory Tracker – OTAO TECHHaven

An advanced inventory management system built for electronics businesses. Track stock levels, monitor sales trends, handle faulty/rejected items, and export data — all from a clean, interactive dashboard.

---

## 🚀 Features

- 📦 **Add & Track Items** – Record new stock, update existing inventory, and monitor quantities.
- 💰 **Sales Monitoring** – Automatically deduct sold items and show analytics for the past 7 and 30 days.
- 📉 **Stock Analytics** – View trends using graphs (line charts, pie charts) for quick insights.
- ⚠️ **Alerts & Notifications**
  - Low stock warnings
  - High faulty/rejected item alerts
  - Upcoming restock deadlines
- 🔁 **Faulty Item Handling** – Log and display returned or defective items for accountability.
- 📤 **Export to Excel** – Easily export current stock and sales history for reporting or backup.
- 🔐 **Optional Authentication** – Login page setup ready (can be extended with auth systems).
- ✨ **Futuristic UI** – Sci-fi-inspired interface with glowing effects and floating animations.

---

## 📁 Project Structure

```bash
.
├── models/           # Mongoose schemas
├── routes/           # Express API routes
├── public/           # Static HTML, CSS, JS
├── static/           # Assets (images, icons)
├── node_modules/     # Dependencies
├── server.js         # Main backend server
├── *.html            # Dashboard, login, analytics, registration
├── main.js           # Frontend JavaScript
├── .gitignore
└── README.md
# 1. Install dependencies
npm install

# 2. Start the server
node server.js

# Optional: For Electron apps
npm start
Uses MongoDB for database Kindly install mongodb
