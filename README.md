# 🎓 Elective Management System# 🎓 Elective Management System



A comprehensive web-based platform for managing student elective course selection, feedback, and progress tracking.A complete web-based system for managing student elective course selection, built with React, TypeScript, Node.js, and MongoDB.



**Built with:** React + TypeScript + Node.js + Express + MongoDB---



---## 📋 Table of Contents



## 📋 Table of Contents- [Features](#-features)

- [Quick Start](#-quick-start-3-steps)

- [Features](#-features)- [Prerequisites](#-prerequisites)

- [Quick Setup](#-quick-setup)- [Installation Guide](#-installation-guide)

- [Deployment](#-deployment)- [Deployment](#-deployment)

- [Environment Configuration](#-environment-configuration)- [Default Admin Account](#-default-admin-account)

- [Default Admin Access](#-default-admin-access)- [Troubleshooting](#-troubleshooting)

- [Tech Stack](#-tech-stack)- [Tech Stack](#-tech-stack)

- [Project Structure](#-project-structure)

---

---

## ✨ Features

## ✨ Features

### For Students:

### Student Portal- 📝 Browse and select electives

- ✅ Browse and select electives by category (Departmental, Open, Humanities)- 📊 View personalized recommendations

- ✅ View personalized elective recommendations- 📈 Track academic progress

- ✅ Track academic progress and selections- 💬 Submit feedback on electives

- ✅ Submit feedback on completed electives- 🔔 Receive notifications and alerts

- ✅ Receive system notifications and alerts

- ✅ View course syllabi (PDF)### For Administrators:

- 👥 Manage students and electives

### Admin Dashboard- 📧 Send alerts and announcements

- ✅ Manage students, electives, and tracks- 📊 View analytics and reports

- ✅ Create and manage feedback templates- 📚 Upload syllabus documents (PDF)

- ✅ Send targeted alerts to students- 🔧 System configuration management

- ✅ View comprehensive analytics and reports- 📝 Review student feedback

- ✅ Export student data (CSV/PDF)

- ✅ Upload and manage syllabus documents---

- ✅ Configure system settings (departments, sections, semesters)

## 🚀 Quick Start (3 Steps)

---

### Step 1: Get MongoDB Database URL

## 🚀 Quick Setup1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

2. Create a **FREE** account

### Prerequisites3. Create a new cluster (free tier available)

- Node.js v20.x or higher ([Download](https://nodejs.org/))4. Create a database user with password

- MongoDB Atlas account ([Sign up FREE](https://www.mongodb.com/cloud/atlas))5. Get your connection string (looks like `mongodb+srv://username:password@...`)



### Installation Steps### Step 2: Configure Environment

1. Copy `.env.example` to `.env`:

1. **Install Dependencies**   ```bash

   ```bash   cp .env.example .env

   npm install   ```

   ```2. Open `.env` and update:

   ```bash

2. **Configure Environment**   MONGODB_URI=your-mongodb-url-from-step-1

   ```bash   JWT_SECRET=any-random-secret-string-here

   # Copy the example environment file   ```

   cp .env.example .env

   ```### Step 3: Install and Run

```bash

3. **Update MongoDB Connection**npm install

   npm start

   Edit `.env` file and add your MongoDB URI:```

   ```env

   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/elective-system?retryWrites=true&w=majority**That's it!** 🎉

   JWT_SECRET=your-random-secret-key-here

   PORT=5000- Frontend: http://localhost:5173

   ```- Backend API: http://localhost:5000



4. **Start the Application**---

   ```bash

   npm start## 📦 Prerequisites

   ```

Make sure you have these installed:

5. **Access the System**

   - Frontend: http://localhost:51731. **Node.js** (v20.x or higher)

   - Backend API: http://localhost:5000/api   - Download: https://nodejs.org/

   - Verify: `node --version`

---

2. **npm** (comes with Node.js)

## 🌐 Deployment   - Verify: `npm --version`



### Method 1: Render (Recommended)3. **MongoDB Atlas Account** (FREE)

   - Sign up: https://www.mongodb.com/cloud/atlas

**Backend Deployment:**

1. Create account on [Render](https://render.com)---

2. Create new **Web Service**

3. Connect your GitHub repository## 📖 Installation Guide

4. Configure:

   - **Build Command:** `npm install`### For Windows:

   - **Start Command:** `node simple-server.cjs`

   - **Environment Variables:**1. **Install Node.js**:

     ```   ```powershell

     MONGODB_URI=your-mongodb-atlas-url   # Download and install from https://nodejs.org/

     JWT_SECRET=your-secret-key   # Or use winget:

     PORT=5000   winget install OpenJS.NodeJS

     NODE_ENV=production   ```

     FRONTEND_URL=https://your-frontend-url.onrender.com

     ```2. **Clone or Download Project**:

   ```powershell

**Frontend Deployment:**   # If using git:

1. Create new **Static Site** on Render   git clone <repository-url>

2. Configure:   cd project

   - **Build Command:** `npm install && npm run build`   

   - **Publish Directory:** `dist`   # Or extract the downloaded ZIP file

   - **Environment Variables:**   ```

     ```

     VITE_API_BASE_URL=https://your-backend-url.onrender.com/api3. **Install Dependencies**:

     ```   ```powershell

   npm install

### Method 2: Railway   ```



**One-Click Deploy:**4. **Configure Environment**:

1. Create account on [Railway](https://railway.app)   ```powershell

2. Create new project from GitHub   # Copy the example file

3. Add MongoDB Atlas connection string in variables   copy .env.example .env

4. Railway auto-detects Node.js and deploys   

   # Edit .env with Notepad

### Method 3: Vercel + Render   notepad .env

   ```

**Frontend on Vercel:**   

```bash   Update these values:

vercel --prod   ```

```   MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/elective-system

   JWT_SECRET=my-college-project-2025-secret-key

**Backend on Render** (same as Method 1)   ```



---5. **Start the Application**:

   ```powershell

## ⚙️ Environment Configuration   npm start

   ```

### Backend (.env)

6. **Open in Browser**:

```env   - Main App: http://localhost:5173

# MongoDB Connection (REQUIRED)   - Login with default admin (see below)

MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/elective-system

### For Mac/Linux:

# JWT Secret for Authentication (REQUIRED)

JWT_SECRET=your-random-secret-key```bash

# Install Node.js (if not installed)

# Server Configuration# Mac: brew install node

PORT=5000# Linux: sudo apt install nodejs npm

NODE_ENV=production

# Install dependencies

# Frontend URL (for CORS)npm install

FRONTEND_URL=https://your-frontend-domain.com

# Configure environment

# Email Configuration (OPTIONAL)cp .env.example .env

# If not configured, password reset tokens will be logged to consolenano .env  # or use any text editor

SMTP_HOST=smtp.gmail.com

SMTP_PORT=587# Start application

SMTP_USER=your-email@gmail.comnpm start

SMTP_PASSWORD=your-app-password```

EMAIL_FROM=noreply@yourdomain.com

```---



### Frontend (.env.production)## 🔐 Default Admin Account



```envOn first run, the system automatically creates a default admin account:

# Backend API URL

VITE_API_BASE_URL=https://your-backend-url.onrender.com/api```

```📧 Email: admin@college.edu

🔑 Password: admin123

---```



## 👤 Default Admin Access**⚠️ IMPORTANT**: Change this password immediately after first login!



After first deployment, use these credentials to login as admin:### How to Change Admin Password:

1. Login with default credentials

```2. Go to Profile → Change Password

Email: admin@elective.com3. Enter a strong new password

Password: admin123

```---



**⚠️ IMPORTANT:** Change the admin password immediately after first login!## 🌐 Deployment



To create a new admin:### Option 1: Render.com (Recommended - Easiest)

1. Register a new user account

2. In MongoDB Atlas, go to your database1. **Create Account**: https://render.com

3. Find the `users` collection2. **New Web Service** → Connect GitHub repository

4. Edit the user document and change `role` from `"student"` to `"admin"`3. **Configure**:

   - Build Command: `npm install && npm run build`

---   - Start Command: `npm start`

4. **Add Environment Variables**:

## 🛠️ Tech Stack   ```

   MONGODB_URI=your-mongodb-url

### Frontend   JWT_SECRET=your-secret-key

- **React 18** - UI library   FRONTEND_URL=https://your-app-name.onrender.com

- **TypeScript** - Type safety   NODE_ENV=production

- **Vite** - Build tool   ```

- **Tailwind CSS** - Styling5. **Deploy** → Your app will be live!

- **Lucide React** - Icons

- **React Router** - Navigation### Option 2: Vercel (Frontend) + Render (Backend)



### Backend**Frontend on Vercel:**

- **Node.js** - Runtime```bash

- **Express.js** - Web frameworknpm install -g vercel

- **MongoDB** - Databasevercel

- **Mongoose** - ODM```

- **JWT** - Authentication

- **Multer** - File uploads**Backend on Render:**

- **Nodemailer** - Email service- Follow Option 1 steps above



---### Environment Variables Needed for Production:



## 📁 Project Structure```bash

# Required

```MONGODB_URI=your-production-mongodb-url

elective-management-system/JWT_SECRET=strong-random-secret-key

├── src/                      # Frontend source codeFRONTEND_URL=https://your-frontend-url.com

│   ├── components/          # React componentsNODE_ENV=production

│   │   ├── common/         # Shared components

│   │   └── layout/         # Layout components# Optional (for email features)

│   ├── contexts/           # React contexts (Auth, Data, Theme)SMTP_HOST=smtp.gmail.com

│   ├── pages/              # Page componentsSMTP_PORT=587

│   │   ├── admin/          # Admin dashboard pagesSMTP_USER=your-email@gmail.com

│   │   └── student/        # Student portal pagesSMTP_PASSWORD=your-app-password

│   ├── services/           # API services```

│   ├── utils/              # Utility functions

│   └── App.tsx             # Main app component---

│

├── server/                  # Backend source code## 🐛 Troubleshooting

│   ├── models/             # Mongoose models

│   ├── routes/             # API routes### Problem: "Cannot connect to MongoDB"

│   └── middleware/         # Express middleware

│**Solution**:

├── simple-server.cjs        # Express server entry point- Check your `.env` file has correct `MONGODB_URI`

├── .env.example            # Environment variables template- Verify MongoDB Atlas IP whitelist (allow 0.0.0.0/0 for testing)

├── package.json            # Dependencies- Ensure database user password is correct

└── vite.config.ts          # Vite configuration

```### Problem: "Port 5000 already in use"



---**Solution**:

```bash

## 📊 Database Collections# Windows:

netstat -ano | findstr :5000

The system automatically creates these MongoDB collections:taskkill /PID <process-id> /F



- **users** - Student and admin accounts# Mac/Linux:

- **electives** - Available elective courseslsof -ti:5000 | xargs kill -9

- **tracks** - Elective track categories```

- **studentelectiveselections** - Student selections and progress

- **feedbackresponses** - Student feedback submissionsOr change port in `.env`:

- **feedbacktemplates** - Admin-created feedback forms```bash

- **syllabi** - Uploaded PDF documentsPORT=3000

- **systemconfigs** - System configuration settings```

- **alerts** - Student notifications

### Problem: "npm install fails"

---

**Solution**:

## 🔧 System Configuration```bash

# Clear npm cache

### Initial Setup (Admin)npm cache clean --force



After logging in as admin:# Delete node_modules and reinstall

rm -rf node_modules package-lock.json

1. **Configure Departments**npm install

   - Go to Admin → System Management```

   - Add your college departments (e.g., CSE, ECE, ME)

### Problem: "Forgot password not working"

2. **Configure Sections**

   - Add sections (e.g., A, B, C)**Solution**:

- Email configuration is OPTIONAL

3. **Configure Semesters**- If email not configured, password reset link will be logged to server console

   - Add active semesters (e.g., 5, 6, 7, 8)- Check terminal output for reset URL

- Copy URL and send to user manually

4. **Add Elective Tracks**

   - Create tracks for each category (Departmental, Open, Humanities)### Problem: "No admin account exists"



5. **Add Electives****Solution**:

   - Go to Admin → Electives- Delete `.env` and recreate from `.env.example`

   - Add courses with details (code, name, credits, department, etc.)- Restart server: `npm start`

- Default admin will be created automatically

6. **Set Deadlines**

   - Configure selection deadlines for each elective---



---## 🛠️ Tech Stack



## 🐛 Troubleshooting### Frontend:

- ⚛️ **React 18** - UI Framework

### MongoDB Connection Issues- 📘 **TypeScript** - Type Safety

```- ⚡ **Vite** - Build Tool

Error: MongoServerError: bad auth- 🎨 **TailwindCSS** - Styling

```- 🔀 **React Router** - Navigation

**Solution:** Check MongoDB username/password in connection string

### Backend:

```- 🟢 **Node.js** - Runtime

Error: connection refused- 🚂 **Express** - Web Framework

```- 🍃 **MongoDB** - Database

**Solution:** Whitelist your IP address in MongoDB Atlas Network Access- 🔐 **JWT** - Authentication

- 📧 **Nodemailer** - Email (Optional)

### Port Already in Use

```### Libraries:

Error: Port 5000 is already in use- 🔒 `bcryptjs` - Password Hashing

```- 📄 `jspdf` - PDF Generation

**Solution:** Change PORT in .env file or kill the process using that port- 📊 `xlsx` - Excel Export

- 🎨 `lucide-react` - Icons

### Build Errors

```---

Error: Cannot find module

```## 📝 Scripts

**Solution:** Delete `node_modules` and run `npm install` again

```bash

---# Development

npm run dev          # Start frontend dev server

## 📞 Supportnpm run server:dev   # Start backend with auto-reload



For issues or questions:# Production

1. Check the [Environment Configuration](#-environment-configuration) sectionnpm run build        # Build frontend for production

2. Verify all prerequisites are installednpm start            # Start production server

3. Ensure MongoDB connection string is correct

4. Check that all environment variables are set# Both (Development)

npm run start:local  # Build frontend + start backend

---

# Linting

## 📝 Licensenpm run lint         # Check code quality

```

This project is created for educational purposes as part of college coursework.

---

---

## 📧 Email Configuration (Optional)

## 🎯 Quick Deployment Checklist

Email is **NOT required** for the system to work. If you want to enable email notifications:

- [ ] MongoDB Atlas database created

- [ ] `.env` file configured with MongoDB URI### Gmail Setup:

- [ ] `JWT_SECRET` changed to random string1. Enable 2-Factor Authentication

- [ ] Dependencies installed (`npm install`)2. Generate App Password: https://myaccount.google.com/apppasswords

- [ ] Application tested locally (`npm start`)3. Update `.env`:

- [ ] Backend deployed (Render/Railway/Heroku)   ```bash

- [ ] Frontend deployed (Render/Vercel/Netlify)   SMTP_HOST=smtp.gmail.com

- [ ] Environment variables configured on hosting platform   SMTP_PORT=587

- [ ] Default admin password changed   SMTP_USER=your-email@gmail.com

- [ ] System configuration completed (departments, sections, etc.)   SMTP_PASSWORD=your-app-password

   EMAIL_FROM="Elective System <noreply@college.edu>"

---   ```



**Ready to deploy!** 🚀 Just connect your MongoDB and go!Without email configured:

- System works normally
- Password reset links logged to console
- Manually send links to users

---

## 📄 License

This project is developed for educational purposes.

---

## 🤝 Support

If you encounter any issues:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Verify all environment variables in `.env`
3. Check server console for error messages
4. Ensure MongoDB connection is active

---

## 🎯 Quick Reference

| Action | Command |
|--------|---------|
| Install | `npm install` |
| Start Dev | `npm run dev` |
| Start Server | `npm start` |
| Build | `npm run build` |
| Check Logs | Check terminal output |

---

**Made with ❤️ for efficient elective management**
