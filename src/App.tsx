/**
 * ELECTIVE SELECTION SYSTEM - MAIN APPLICATION COMPONENT
 * 
 * This is the root component that sets up the entire application structure.
 * It provides routing, authentication, and context providers for the entire app.
 * 
 * Key Features:
 * - Role-based routing (Student/Admin)
 * - Protected route components
 * - Global context providers
 * - Authentication state management
 * - Responsive navigation structure
 * 
 * @author Sahil Sukhdeve
 * @version 1.0.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Context Providers for global state management
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Authentication pages (public routes)
import Login from './pages/Login';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';

// Student pages (protected routes for student role)
import StudentElectiveSelection from './pages/student/StudentElectiveSelection';
import StudentProgress from './pages/student/StudentProgress';
import StudentRoadmap from './pages/student/StudentRoadmap';
import StudentProfile from './pages/student/StudentProfile';
import StudentFeedback from './pages/student/StudentFeedback';

// Admin pages (protected routes for admin role)
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminElectives from './pages/admin/AdminElectives';
import AdminStudents from './pages/admin/AdminStudents';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminFeedback from './pages/admin/AdminFeedback';
import AdminFeedbackResponses from './pages/admin/AdminFeedbackResponses';
import AdminAlerts from './pages/admin/AdminAlerts';
import AdminSystemManagement from './pages/admin/AdminSystemManagement';
import AdminSystemStatus from './pages/admin/AdminSystemStatus';

// Layout and common components
import Navbar from './components/layout/Navbar';
import NotificationToast from './components/common/NotificationToast';
import StudentRedirect from './components/common/StudentRedirect';

/**
 * Protected Route Component
 * 
 * Wrapper component that ensures only authenticated users can access certain pages.
 * Shows loading spinner while checking authentication status.
 * Redirects to login page if user is not authenticated.
 * 
 * @param children - React components to render if user is authenticated
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  // Show loading spinner while authentication is being verified
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  // Redirect to login if user is not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Render protected content if user is authenticated
  return <>{children}</>;
}

/**
 * Admin Route Component
 * 
 * Specialized protected route that only allows admin users to access admin pages.
 * Redirects students to their dashboard if they try to access admin routes.
 * 
 * @param children - React components to render if user is admin
 */
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  // Show loading spinner while authentication is being verified
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  // Redirect to login if user is not authenticated or not admin
  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }
  
  // Render admin content if user is authenticated admin
  return <>{children}</>;
}

/**
 * Student Route Component
 * 
 * Specialized protected route that only allows student users to access student pages.
 * Redirects admins or unauthenticated users to login page.
 * 
 * @param children - React components to render if user is student
 */
function StudentRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  // Show loading spinner while authentication is being verified
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  // Redirect to login if user is not authenticated or not student
  if (!user || user.role !== 'student') {
    return <Navigate to="/login" replace />;
  }
  
  // Render student content if user is authenticated student
  return <>{children}</>;
}

/**
 * App Routes Component
 * 
 * Defines all application routes with proper role-based access control.
 * Handles navigation between different pages based on user authentication and role.
 */
function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Routes - accessible when not logged in */}
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/" replace />} />
      <Route path="/reset-password" element={!user ? <ResetPassword /> : <Navigate to="/" replace />} />
      
      {/* Home Route - redirects based on user role */}
      <Route path="/" element={
        <ProtectedRoute>
          {user?.role === 'student' ? <StudentRedirect /> : <AdminDashboard />}
        </ProtectedRoute>
      } />

      {/* Student Routes - accessible only to students */}
      <Route path="/electives" element={
        <StudentRoute>
          <StudentElectiveSelection />
        </StudentRoute>
      } />
      <Route path="/progress" element={
        <StudentRoute>
          <StudentProgress />
        </StudentRoute>
      } />
      <Route path="/roadmap" element={
        <StudentRoute>
          <StudentRoadmap />
        </StudentRoute>
      } />
      <Route path="/profile" element={
        <StudentRoute>
          <StudentProfile />
        </StudentRoute>
      } />
      <Route path="/feedback" element={
        <StudentRoute>
          <StudentFeedback />
        </StudentRoute>
      } />
      
      {/* Admin Routes - accessible only to administrators */}
      <Route path="/admin" element={
        <AdminRoute>
          <AdminDashboard />
        </AdminRoute>
      } />
      <Route path="/admin/electives" element={
        <AdminRoute>
          <AdminElectives />
        </AdminRoute>
      } />
      <Route path="/admin/students" element={
        <AdminRoute>
          <AdminStudents />
        </AdminRoute>
      } />
      <Route path="/admin/analytics" element={
        <AdminRoute>
          <AdminAnalytics />
        </AdminRoute>
      } />
      <Route path="/admin/feedback" element={
        <AdminRoute>
          <AdminFeedback />
        </AdminRoute>
      } />
      <Route path="/admin/feedback-responses" element={
        <AdminRoute>
          <AdminFeedbackResponses />
        </AdminRoute>
      } />
      <Route path="/admin/alerts" element={
        <AdminRoute>
          <AdminAlerts />
        </AdminRoute>
      } />
      <Route path="/admin/system" element={
        <AdminRoute>
          <AdminSystemManagement />
        </AdminRoute>
      } />
      <Route path="/admin/status" element={
        <AdminRoute>
          <AdminSystemStatus />
        </AdminRoute>
      } />
      
      {/* Catch-all route - redirect any unknown URLs to login page */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

/**
 * Main App Component
 * 
 * Root component that wraps the entire application with context providers.
 * Sets up the provider hierarchy in the correct order for proper data flow.
 * 
 * Provider Order (outer to inner):
 * 1. ThemeProvider - Manages dark/light theme
 * 2. AuthProvider - Handles authentication state
 * 3. DataProvider - Manages application data
 * 4. NotificationProvider - Handles notifications/toasts
 * 5. Router - Handles client-side routing
 */
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <NotificationProvider>
            <Router>
              <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
                <AppContent />
                <NotificationToast />
              </div>
            </Router>
          </NotificationProvider>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

/**
 * App Content Component
 * 
 * Renders the main application layout including navigation and page content.
 * Conditionally applies top padding when user is logged in (to account for navbar).
 */
function AppContent() {
  const { user } = useAuth();

  return (
    <>
      {/* Navigation bar - shown on all pages when user is authenticated */}
      <Navbar />
      
      {/* Main content area with conditional padding for navbar */}
      <main className={user ? "pt-16" : ""}>
        <AppRoutes />
      </main>
    </>
  );
}

export default App;