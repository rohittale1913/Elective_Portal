# 🚀 Deployment Guide - Elective Selection System

## ✅ Pre-Deployment Checklist

- [x] Production build created (`npm run build`)
- [x] Changes committed and pushed to GitHub
- [x] Section field fix applied and tested
- [x] Server running successfully with `simple-server.cjs`

---

## 🌐 Deployment Options

### Option 1: Deploy to Render (Recommended)

Render is already configured in this project. Follow these steps:

#### Step 1: Sign up / Login to Render
1. Go to [https://render.com](https://render.com)
2. Sign up or login with your GitHub account

#### Step 2: Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `Sahil-Sukhdeve12/major_project`
3. Configure the service:

   **Basic Settings:**
   - **Name**: `elective-selection-system` (or your preferred name)
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: Leave blank
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

   **Advanced Settings:**
   - **Plan**: Free (or choose a paid plan for better performance)
   - **Instance Type**: Web Service

#### Step 3: Environment Variables
Click **"Advanced"** → **"Add Environment Variable"** and add:

```
MONGODB_URI=<your-mongodb-atlas-connection-string>
JWT_SECRET=<your-secret-key-minimum-32-characters>
NODE_ENV=production
PORT=5000
```

**Important:** 
- Get `MONGODB_URI` from your MongoDB Atlas dashboard
- Generate a strong `JWT_SECRET` (you can use: https://randomkeygen.com/)
- Make sure your MongoDB Atlas allows connections from anywhere (0.0.0.0/0) for Render

#### Step 4: Deploy
1. Click **"Create Web Service"**
2. Render will automatically:
   - Clone your repository
   - Install dependencies
   - Build the frontend
   - Start the server
   - Provide you with a URL (e.g., `https://elective-selection-system.onrender.com`)

#### Step 5: MongoDB Atlas Configuration
1. Go to MongoDB Atlas → Network Access
2. Click **"Add IP Address"**
3. Choose **"Allow Access from Anywhere"** (0.0.0.0/0)
4. Click **"Confirm"**

#### Step 6: Test Your Deployment
1. Visit your Render URL
2. Try logging in with your admin credentials
3. Check that sections are displaying correctly
4. Test creating students and assigning electives

---

### Option 2: Deploy to Vercel

Vercel is great for frontend but requires separate backend deployment.

#### Frontend Deployment (Vercel)
1. Go to [https://vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. Add Environment Variable:
   ```
   VITE_API_BASE_URL=<your-backend-url>
   ```

#### Backend Deployment (Render for Backend)
1. Follow Render steps above but use:
   - **Build Command**: `npm install`
   - **Start Command**: `node simple-server.cjs`
   
2. Use the Render backend URL as `VITE_API_BASE_URL` in Vercel

---

### Option 3: Deploy to Railway

1. Go to [https://railway.app](https://railway.app)
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your repository
4. Railway will auto-detect Node.js
5. Add environment variables:
   ```
   MONGODB_URI=<your-connection-string>
   JWT_SECRET=<your-secret>
   NODE_ENV=production
   ```
6. Deploy!

---

## 🔧 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-super-secret-key-min-32-chars` |
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port (auto-set by platforms) | `5000` |
| `VITE_API_BASE_URL` | Backend API URL (for Vercel) | `https://api.yourapp.com/api` |

---

## 📝 Post-Deployment Steps

### 1. Update CORS Settings (if needed)
If you encounter CORS errors, update `simple-server.cjs`:

```javascript
app.use(cors({
  origin: ['https://your-frontend-domain.com', 'https://your-backend-domain.com'],
  credentials: true
}));
```

### 2. Seed Initial Data
After deployment, you can seed data by:

1. SSH into your server (if possible) or
2. Create an admin endpoint to seed data or
3. Manually create users through the registration page

### 3. Create Admin User
If you don't have an admin user:

1. Register as a new user on the deployed site
2. Manually update the user's role in MongoDB Atlas:
   - Go to MongoDB Atlas → Browse Collections
   - Find the `users` collection
   - Find your user and change `role` from `student` to `admin`

---

## 🔍 Troubleshooting

### Issue: "Cannot connect to database"
- **Solution**: Check MongoDB Atlas network access allows 0.0.0.0/0
- Verify `MONGODB_URI` is correct in environment variables

### Issue: "Sections showing as undefined"
- **Solution**: This is already fixed in the latest commit
- Make sure the deployment used the latest code from GitHub

### Issue: "500 Internal Server Error"
- **Solution**: Check the deployment logs for specific errors
- Verify all environment variables are set correctly

### Issue: "CORS Error"
- **Solution**: Update CORS settings in `simple-server.cjs` to include your frontend domain

### Issue: "Free tier sleeping"
- **Solution**: Render free tier sleeps after 15 min inactivity
- Consider upgrading to a paid tier or use a service like UptimeRobot to ping your app

---

## 📊 Monitoring

### Check Deployment Logs
- **Render**: Dashboard → Your Service → Logs
- **Vercel**: Dashboard → Your Project → Deployments → View Logs
- **Railway**: Dashboard → Your Project → Deployments → View Logs

### Monitor Performance
- Use built-in platform metrics
- Consider adding services like:
  - New Relic
  - Datadog
  - Sentry (for error tracking)

---

## 🎉 Your App is Live!

Once deployed, your Elective Selection System will be accessible at:
- **Render**: `https://your-service-name.onrender.com`
- **Vercel**: `https://your-project.vercel.app`
- **Railway**: `https://your-project.up.railway.app`

**Default Admin Credentials** (if seeded):
- Email: `admin@system.com`
- Password: `admin123`

**⚠️ SECURITY NOTE:** Change the default admin password immediately after first login!

---

## 📧 Support

If you encounter any issues during deployment:
1. Check the deployment logs
2. Verify environment variables
3. Check MongoDB Atlas connection
4. Review the troubleshooting section above

Good luck with your deployment! 🚀
